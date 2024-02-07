const { getAggregatorStatusMapper, tryOr, getMerchantAggregatorConfig } = require("../utils/aggregatorUtils");
const logger = require("../common/logger");
const qrcode = require('qrcode');
const Aggregator = require("./aggregators/aggregator");
const { Order, Transaction, User } = require("../models/models");
const { BadRequestError, NotFoundError, AuthorizationError } = require("../common/customError");
const { Settings, httpStatus, ActionType } = require("../../constants");
const { fdkExtension } = require("../fdk/index")
const { getHmacChecksum, compareHashDigest } = require("../utils/signatureUtils");
const config = require("../config");
const removeTrailingSlash = require("../utils/commonUtils");


class AggregatorFactory {

    static async createInstance(kwargs) {
        const instance = new AggregatorFactory();
        return await instance.initObject(Aggregator, kwargs)
    }

    async initObject(aggregatorClass, kwargs) {
        // initiate aggregator
        let aggregator = new aggregatorClass(aggregatorClass)
        let secrets = await getMerchantAggregatorConfig(kwargs)

        await aggregator.setAggregatorConfig(secrets)
        return aggregator
    }
}

class AggregatorProcessor {

    async saveOrderDetails(data, orderResponse) {
        

        await Order.create({
            gid: data.gid,
            aggregator_order_id: orderResponse.aggregatorOrderId,
            amount: data.amount,
            payment_methods: data.payment_methods,
            billing_address: data.billing_address,
            shipping_address: data.shipping_address,
            currency: data.currency,
            app_id: data.app_id,
            meta: {
                request: data,
                success_url: data.success_url,
                cancel_url: data.cancel_url,
            },
            g_user_id: data.g_user_id,
            locale: data.locale
        });
        const transactionData = {
            gid: data.gid,
            g_user_id: data.g_user_id,
            aggregator_order_id: orderResponse.aggregatorOrderId,
            aggregator_payment_id: orderResponse.aggregatorPaymentId,
            amount: data.amount,
            current_status: orderResponse.status,
            journey_type: orderResponse.journeyType,
            status: [{
                status: orderResponse.status,
                meta: {
                    pgResponse: orderResponse.meta.response.data,
                    redirectInfo: orderResponse.redirectInfo
                }
            }]
        }
        if (orderResponse.action === ActionType.HTMLSTRING) {
            transactionData.status[0].meta.redirectInfo = {
                action: ActionType.HTMLSTRING,
                htmlString: orderResponse.meta.response?.htmlForm
            }
        }
        else if (orderResponse.action === ActionType.REDIRECT) {
            transactionData.status[0].meta.redirectInfo = {
                action: ActionType.REDIRECT,
                redirectUrl: orderResponse.meta.response._links.redirect.href
            }
        }

        logger.info("Added transaction | %O", transactionData);
        const transaction = await Transaction.create(transactionData);
        await User.findOneAndUpdate(
            { 
                g_user_id: data.g_user_id,
                app_id: data.app_id
            },
            {
                name: data.customer_name,
                mobile: data.customer_contact,
                email: data.customer_email,
                app_id: data.app_id
            },
            { upsert: true, new: false },
        );
        return transaction._id;
    }

    async createOrder(data) {
        /*
        Args: data(Dict object) = contains createOrder Payload
    
        Retuns:
            action: render/redirect
            url: if actions == redirect then URL is mandatory else htmlString required to render page
            g_id: Global order ID(Platform Order ID)
    
        Sample payload that aggregator createOrder function returns
            {
                "gid": "FY2132141234AD231",
                "aggregatorOrderId": "ord_2345sadsa65",
                "status": "started",
                "amount": 7654,
                "action": "redirect/render",
                "url": "<pg_url>",
                "htmlString": "<html> ... </html>"
                "aggregatorUserID": "CUST_7654345678",
                "app_id": "<app_id>",
                "meta": {
                    "response": {...}
                }
            }
        */

        if ((await Order.find({ gid: data.gid })).length !== 0) {
            throw new BadRequestError("duplicate order id " + data.gid);
        }
        logger.info("createOrder");
        const instance = await AggregatorFactory.createInstance({ appId: data.app_id });
        let orderResponse = await instance.createOrder(data);

        logger.info("Order Response: %O", JSON.stringify(orderResponse))

        // Save into DB
        const _id = await this.saveOrderDetails(data, orderResponse)

        return {
            success: true,
            _id: _id,
            redirect_url: removeTrailingSlash(config.extension.base_url) + "/api/v1/pgloader/" + _id
        }
    }

    async renderPG(data) {
        const transaction = await Transaction.findById(data._id);
        if (!transaction) {
            throw new NotFoundError("transaction not found");
        }

        let redirectInfo = transaction.status[0].meta.redirectInfo;
        if (redirectInfo.action == ActionType.POLLING) {
            const qrOption = { 
                margin : 7,
                width : 330
            };
            const qrString = redirectInfo.paymentLink;
            redirectInfo.pollingData["qrImage"] = await qrcode.toDataURL(qrString, qrOption);
            redirectInfo.pollingData["expiry"] = Settings.pollingDuration
        };

        return redirectInfo;
    }

    async processCallback(data) {
        logger.info("Callback Payload: %O", JSON.stringify(data))
        const gid = data.responseData.transactionRefNumber;
        const order = await Order.findOne({ gid: gid });
        if (!order) {
            throw new NotFoundError("order not found " + data.gid);
        }
        data.aggregatorOrderId = order.aggregator_order_id;

        const instance = await AggregatorFactory.createInstance({ appId: order.app_id });
        const callbackResponse = await instance.processCallback(data, order);

        await Transaction.updateOne(
            { gid: gid },
            {
                $set: {
                    aggregator_payment_id: callbackResponse.meta.paymentDetail[0].instrumentReference,
                    current_status: callbackResponse.status
                },
                $push: {
                    status: {
                        status: callbackResponse.status,
                        meta: callbackResponse.meta
                    }
                }
            }
        );
        var redirectUrl;
        try {
            await this.updatePlatformPaymentStatus(order, callbackResponse.status, data, 'callback');
            redirectUrl = callbackResponse.status == "complete" ? order.meta.request.success_url : order.meta.request.cancel_url
        } catch (err) {
            redirectUrl = order.meta.request.cancel_url;
            console.log(err);
        }

        return {
            action: "redirect",
            redirectUrl: encodeURIComponent(redirectUrl)
        };
    };

    async getPaymentDetails(data) {
        const forwardTransaction = await Transaction.findOne({ gid: data.gid});
        const order = await Order.findOne({ gid: data.gid });
        if (!forwardTransaction) {
            throw new NotFoundError("transaction for order " + data.gid);
        }
        const instance = await AggregatorFactory.createInstance({ appId: order.app_id });
        const aggResponse = await instance.getOrderDetails(data, data.gid);
        const response = {
            gid: data.gid,
            status: tryOr(() => aggResponse.statusMapper.status, forwardTransaction.current_status),
            total_amount: aggResponse.amount,
            currency: order.currency,
            payments: [{
                payment_id: forwardTransaction.aggregator_payment_id,
                order_id: forwardTransaction.aggregator_order_id,
                captured: forwardTransaction.current_status == "complete",
                status: forwardTransaction.current_status,
                amount_captured: forwardTransaction.amount,   // is it different then amount?
                amound_refunded: null,
                gid: forwardTransaction.gid,
                g_user_id: forwardTransaction.g_user_id,
                amount: aggResponse.amount,
                currency: forwardTransaction.currency,
                merchant_locale: order.meta.request.merchant_locale,
                locale: order.meta.request.locale,
                mode: order.meta.request.mode,
                payment_methods: order.payment_methods,
                success_url: order.meta.request.success_url,
                cancel_url: order.meta.request.cancel_url,
                billing_address: order.meta.request.billing_address,
                shipping_address: order.meta.request.shipping_address,
                kind: order.meta.request.kind,
                initiated_at: order.meta.request.initiated_at
            }],
        };
        return response;
    };

    async processRefund(data) {
        // request:
        // {
        //     "gid": "<fynd_order_id>",
        //     "object": "refund",
        //     "request_id": "",
        //     "amount": amount in paise integer,
        //     "currency": "",
        //     "status": "initiate"
        // }
        logger.info("ProcessRefund Request: %O", data)
        const forwardTransaction = await Transaction.findOne({ gid: data.gid, journey_type: "forward" });
        const order = await Order.findOne({ gid: data.gid });
        if (!forwardTransaction) {
            throw new NotFoundError("transaction for order " + data.gid);
        }
        if (forwardTransaction.current_status !== "complete" || !forwardTransaction.aggregator_payment_id) {
            throw new BadRequestError(
                "transaction pending aggregator {" + data.gid + "} current status: " + forwardTransaction.current_status
            );
        }
        data.forwardPaymentId = forwardTransaction.aggregator_payment_id;

        const instance = await AggregatorFactory.createInstance({ appId: order.app_id });
        const refundResponse = await instance.processRefund(data);
        logger.info("ProcessRefund pg response: %O", refundResponse)

        const status_mapper = await getAggregatorStatusMapper(refundResponse.status, refundResponse.journeyType);

        const refundTransaction = await Transaction.create({
            gid: data.gid,
            g_user_id: forwardTransaction.g_user_id,
            aggregator_order_id: forwardTransaction.aggregator_order_id,
            aggregator_payment_id: forwardTransaction.aggregator_payment_id,
            refund_request_id: data.request_id,
            aggregator_refund_id: refundResponse.aggregatorActionId,
            amount: data.amount,
            current_status: status_mapper.status,
            journey_type: refundResponse.journeyType,
            status: [{
                status: status_mapper.status,
                meta: {
                    refundMeta: refundResponse.meta.response.data
                }
            }]
        });
        const response = {
            gid: forwardTransaction.gid,
            aggregator_payment_details: {
                payment_id: forwardTransaction.aggregator_payment_id,
                aggregator_order_id: forwardTransaction.aggregator_order_id,
                aggregator_customer_id: "",  // aggregator customer id?
                captured: forwardTransaction.current_status == "complete",
                amount_captured: forwardTransaction.amount,   // is it different then amount?
                amound_refunded: refundTransaction.amount,
                gid: forwardTransaction.gid,
                g_user_id: forwardTransaction.g_user_id,
                amount: order.amount,
                currency: order.currency,
                merchant_locale: order.meta.request.merchant_locale,
                locale: order.meta.request.locale,
                mode: order.meta.request.mode,
                payment_methods: order.payment_methods,
                success_url: order.meta.request.success_url,
                cancel_url: order.meta.request.cancel_url,
                billing_address: order.meta.request.billing_address,
                shipping_address: order.meta.request.shipping_address,
                kind: order.meta.request.kind,
                initiated_at: order.meta.request.initiated_at
            },
            aggregator_payment_refund_details: {
                request_id: data.request_id,
                amount: refundTransaction.amount,
                status: refundTransaction.current_status,
                currency: order.currency,
                refund_utr: refundTransaction.aggregator_refund_id,
                payment_id: refundTransaction.aggregator_payment_id,
                reason: data.reason,
                receipt_number: refundTransaction.aggregator_refund_id,
                transfer_reversal: "", // ...?
                source_transfer_reversal: "", // ...?
                created: Date.parse(refundTransaction.createdAt),
                balance_transaction: "" // ...?
            }
        };
        return response;
    };

    async processWebhook(requestPayload) {
        logger.info("Webhook Recieved: %O", requestPayload);
        let data = requestPayload.data;
        const gid = data.transactionRefNumber;

        const order = await Order.findOne({ gid: gid });

        if (!order) {
            logger.info("Order not found: " + gid);
            throw new NotFoundError("Order not found");
        }

        const instance = await AggregatorFactory.createInstance({ appId: order.app_id });
        const webhookResponse = await instance.processWebhook(requestPayload, order);

        await Transaction.updateOne(
            { gid: gid },
            {
                $set: {
                    aggregator_payment_id: webhookResponse.aggregatorTransactionId,
                    current_status: webhookResponse.status
                },
                $push: {
                    status: {
                        status: webhookResponse.status,
                        meta: webhookResponse.meta
                    },
                }
            }
        )
        const response = await this.updatePlatformPaymentStatus(order, webhookResponse, "webhook");
        logger.info("processWebhook Platform Syncing response: %O", JSON.stringify(response));
    }

    async updatePlatformPaymentStatus(order, response, source) {
        // calls fynd platform paymentstatus update webhook

        const payload = {
            "gid": order.gid,
            "status": response.status,
            "total_amount": order.amount,
            "currency": order.currency,
            "source": source,
            "payment_details": [{
                "payment_id": response.aggregatorTransactionId,
                "aggregator_order_id": order.aggregator_order_id,
                "aggregator_customer_id": "",
                "captured": true,
                "status": response.status,
                "amount_captured": order.amount,
                "amount_refunded": 0,
                "gid": order.gid,
                "g_user_id": order.g_user_id,
                "amount": order.amount,
                "currency": order.currency,
                "merchant_locale": order.meta.request.merchant_locale,
                "locale": order.meta.request.locale,
                "mode": response.paymentMode || order.meta.request.mode,
                "payment_methods": order.payment_methods,
                "success_url": order.meta.request.success_url,
                "cancel_url": order.meta.request.cancel_url,
                "billing_address": order.billing_address,
                "shipping_address": order.shipping_address,
                "kind": order.meta.request.kind,
                "created": String(Date.parse(order.createdAt)),
            }],
            "order_details": {
                "gid": order.gid,
                "amount": order.amount,
                "currency": order.currency,
                "aggregator": config.extension.aggregator_slug,
                "status": response.status,
                "aggregator_order_details": {
                    "aggregator_order_id": order.gid,
                    "amount": order.amount,
                    "currency": order.currency,
                    "aggregator": config.extension.aggregator_slug,
                    "status": response.status
                }
            }
        };

        const checksum = getHmacChecksum(JSON.stringify(payload), config.extension.Platform_api_salt);
        payload["checksum"] = checksum

        logger.info("Updating Payment status on Platform: %O", JSON.stringify(payload));

        let platformClient = await fdkExtension.getPlatformClient(order.meta.request.company_id);
        const applicationClient = platformClient.application(order.app_id);
        const sdkResponse = await applicationClient.payment.updatePaymentSession({gid: order.gid, body: payload});

        logger.info(
            "updatePlatformPaymentStatus[%s] Platform Syncing response: %O", source, JSON.stringify(sdkResponse)
        );
    }

    async processRefundWebhook(data) {
        /* sample webhook payload
            This is only for reference
            Webhook request data:
            refund Ok: {
                "success": true,
                "status": "refund_done",
                "refundId": "<refund_id>",
                "transactionRefNumber": "<transaction_ref_no>",
                "transactionDateTime": "2020-06-24T05:58:49",
                "transactionType": "REFUND",
                "amount": "100",
            }
        */
        logger.info("Refund Webhook Recieved: %O", data);
        const transaction = await Transaction.findOne({ aggregator_refund_id: data.refundId });
        const order = await Order.findOne({ gid: transaction.gid });

        const instance = await AggregatorFactory.createInstance({ appId: order.app_id });
        const webhookResponse = await instance.processRefundWebhook(data, transaction);

        await Transaction.updateOne(
            { aggregator_refund_id: data.refundId },
            {
                $set: {
                    current_status: webhookResponse.status
                },
                $push: {
                    status: {
                        status: webhookResponse.status,
                        meta: data
                    }
                }
            }
        );
        const response = await this.updatePlatformRefundStatus(order, transaction, statusMapper.status, data, "refund_webhook");
        logger.info(JSON.stringify(response));
    }

    async updatePlatformRefundStatus(order, transaction, status, data, source) {
        // calls fynd platform refundstatus update webhook
        const payload = {
            "gid": order.gid,
            "status": status,
            "total_amount": order.amount,
            "currency": order.currency,
            "refund_details": [{
                "request_id": transaction.refund_request_id,
                "amount": data.paymentDetail.totalAmount,
                "currency": order.currency,
                "refund_utr": data.refundId,
                "payment_id": transaction.aggregator_order_id,
                "status": status,
                "reason": "",
                "receipt_number": data.refundId,
                "transfer_reversal": "",
                "source_transfer_reversal": "",
                "created": String(Date.parse(transaction.createdAt)),
                "balance_transaction": ""
            }],
            "payment_details": {
                "payment_id": transaction.aggregator_order_id,
                "aggregator_order_id": transaction.aggregator_order_id,
                "aggregator_customer_id": "",
                "captured": true,
                "status": status,
                "amount_captured": order.amount,
                "amount_refunded": data.paymentDetail.totalAmount,
                "gid": order.gid,
                "g_user_id": transaction.g_user_id,
                "amount": order.amount,
                "currency": order.currency,
                "merchant_locale": order.meta.request.merchant_locale,
                "locale": order.meta.request.locale,
                "mode": order.meta.request.mode,
                "payment_methods": order.payment_methods,
                "success_url": order.meta.request.success_url,
                "cancel_url": order.meta.request.cancel_url,
                "billing_address": order.billing_address,
                "shipping_address": order.shipping_address,
                "kind": order.meta.request.kind,
                "created": String(Date.parse(order.createdAt)),
            },
        }

        const checksum = getHmacChecksum(JSON.stringify(payload), config.extension.Platform_api_salt);
        payload["checksum"] = checksum

        logger.info("Updating Refund status on Platform: %O", JSON.stringify(payload));

        let platformClient = await fdkExtension.getPlatformClient(order.meta.request.company_id);
        const applicationClient = platformClient.application(order.app_id);
        const sdkResponse = await applicationClient.payment.updateRefundSession({gid: order.gid, requestId: transaction.refund_request_id, body: payload});
        logger.info(
            "updatePlatformRefundStatus[%s] Platform Syncing response: %O", source, JSON.stringify(sdkResponse)
        );
    }

    async processPaymentUpdateStatus(requestPayload) {
        logger.info("processPaymentUpdateStatus payload Recieved: %O", JSON.stringify(requestPayload));
        let data = requestPayload.data
        const gid = data.gid;

        const order = await Order.findOne({ gid: gid });

        if (!order) {
            logger.info("Order not found: " + gid);
            throw new NotFoundError("Order not found");
        }

        const instance = await AggregatorFactory.createInstance({ appId: order.app_id });
        let paymentUpdateResponse = await instance.paymentUpdateStatus(data, order);
        console.log(data)

        logger.info("processPaymentUpdateStatus response: %O", JSON.stringify(paymentUpdateResponse));

        if (data.counter < Settings.pollingDuration) {
            data.counter = parseInt(data.counter) + 1
        }
        if (data.counter >= Settings.pollingDuration || paymentUpdateResponse.status != 'initiated') {
            paymentUpdateResponse.retry = false
        }

        if (!paymentUpdateResponse.retry) {
            logger.info("processPaymentUpdateStatus Saving into DB: %O", JSON.stringify(paymentUpdateResponse));
            await Transaction.updateOne(
                { gid: data.gid },
                {
                    $set: {
                        aggregator_payment_id: paymentUpdateResponse.aggregatorTransactionId,
                        current_status: paymentUpdateResponse.status
                    },
                    $push: {
                        status: {
                            status: paymentUpdateResponse.status,
                            meta: paymentUpdateResponse.meta
                        },
                    }
                }
            );
            // const response = await this.updatePlatformPaymentStatus(order, paymentUpdateResponse, "update");
            // logger.info("processPaymentUpdateStatus Platform Syncing response: %O", JSON.stringify(response));
        }
        return {
            "status": paymentUpdateResponse.status,
            "successURL": order.meta.success_url,
            "cancelURL": order.meta.cancel_url,
            "success": true,
            "gid": data.gid,
            "amount": data.amount,
            "retry": paymentUpdateResponse.retry,
            "counter": data.counter || 1,
            "returnUrl": order.meta.success_url
        };
    }

    async processPaymentCancel(requestPayload) {
        logger.info("Payment Cancel Recieved: %O", requestPayload);

        const transaction = await Transaction.findById(requestPayload._id);
        if (!transaction) {
            throw new NotFoundError("transaction not found");
        }

        const order = await Order.findOne({ gid: transaction.gid });

        if (transaction.current_status != "initiated") {
            return {
                "success": true,
                "cancelled": false,
                "cancelUrl": order.meta.cancel_url,
                "message": `Transaction is not Cancelled as the transaction is moved to ${transaction.current_status} statue`
            }
        }

        const instance = await AggregatorFactory.createInstance({ appId: order.app_id });
        const cancelResponse = await instance.processCancelPayment(requestPayload, order);

        await Transaction.updateOne(
            { _id: _id },
            {
                $set: {
                    current_status: cancelResponse.status
                },
                $push: {
                    status: {
                        status: cancelResponse.status,
                        meta: cancelResponse.meta
                    },
                }
            }
        )
        const response = await this.updatePlatformPaymentStatus(order, cancelResponse, "cancel");
        logger.info("processPaymentCancel Platform Syncing response: %O", JSON.stringify(response));

        return {
            "success": true,
            "cancelled": true,
            "cancelUrl": order.meta.cancel_url,
            "message": "Transaction is Cancelled."
        };
    }

    async processShipmentUpdate(requestPayload) {
        const order = await Order.findOne({ gid: requestPayload.gid })
        if(!order) {
            throw new BadRequestError(`Order ${requestPayload.gid} does not exist`);
        }
        
        const instance = AggregatorFactory.createInstance({appId: order.app_id});
        const response = await instance.processShipmentUpdate(requestPayload);
        return response;
    }

    async validateCustomer(requestPayload) {
        const instance = AggregatorFactory.createInstance({appId: requestPayload.app_id});
        const response = await instance.validateCustomer(requestPayload);
        return response;
    }
}

module.exports = AggregatorProcessor