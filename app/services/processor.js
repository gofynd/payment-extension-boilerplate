const Aggregator = require("./aggregators/aggregator");
const { BadRequestError, NotFoundError } = require("../utils/errorUtils");
const { fdkExtension } = require("../fdk")
const config = require("../config");
const { getHmacChecksum } = require("../utils/signatureUtils");


class AggregatorProcessor {

    async getFdkExtension() {
        if (!this.fdkExtension) {
            this.fdkExtension = await Fdkfactory.fdkExtension();
        }
    }

    async createOrder(request_payload) {
        /*
        Refer this page for more info
        https://partners.fynd.com/help/docs/partners/extension/payments/building-payment-extension/payment-flow/initiatePaymentSession

        Payload:
        {
            "customer_name": "Customer Name",
            "customer_email": "email@gmail.com",
            "app_id": "000000000000000000000001",
            "company_id": "1",
            "customer_contact": "8888888888",
            "gid": "TR662637B30D570001",
            "fynd_platform_id": "FY662A607D0EC6524BEA",
            "g_user_id": "65fc3a26b7e85bd44752641a",
            "amount": 100000,
            "currency": "INR",
            "merchant_locale": "en",
            "locale": "en",
            "mode": "live",
            "journey_type": "forward",
            "payment_methods": [
                {
                    "code": "DUMMY",
                    "name": "DUMMY",
                    "sub_payment_mode": []
                }
            ],
            "success_url": "https://fynd.com/cart/order-status?success=true&status=complete&order_id=FY662A607D0EC6524BEA&aggregator_name=Dummy&cart_id=662a5d614d4cd74ae13afe36",
            "cancel_url": "https://fynd.com/cart/order-status?success=false&status=failed&order_id=FY662A607D0EC6524BEA&aggregator_name=Dummy&cart_id=662a5d614d4cd74ae13afe36",
            "billing_address": {
                "area": "Bengalur",
                "city": "Bangalore",
                "name": "Customer name",
                "email": "email@gmail.com",
                "phone": "8888888888",
                "state": "Karnataka",
                "address": "Bengalur",
                "country": "India",
                "pincode": "560077",
                "landmark": "Bengalur",
                "area_code": "560077",
                "pos_state": "Karnataka",
                "address_id": 3535,
                "address_type": "home",
                "area_code_slug": "560077",
                "country_iso_code": "IN",
                "country_phone_code": "+91",
                "g_address_id": "None"
            },
            "shipping_address": {
                "area": "Bengalur",
                "city": "Bangalore",
                "name": "Customer name",
                "email": "email@gmail.com",
                "phone": "8888888888",
                "state": "Karnataka",
                "address": "Bengalur",
                "country": "India",
                "pincode": "560077",
                "landmark": "Bengalur",
                "area_code": "560077",
                "pos_state": "Karnataka",
                "address_id": 3535,
                "address_type": "home",
                "area_code_slug": "560077",
                "country_iso_code": "IN",
                "country_phone_code": "+91",
                "g_address_id": "None"
            },
            "kind": "sale",
            "initiated_at": 1714053246,
            "cod_eligibility": true,
            "meta": {}
        }
    
        Retuns:
            gid: transaction gid
            redirect_url: payment gateway checkout url
            success: true/false
    
        Return sample payload
        {
            "gid": "TR64D4E4250DB0CBEF1D",
            "redirect_url": "https://pg-url.com/payments/payment_id_001",
            "success": false
        }
        */

        console.log("Payload received from platform", request_payload);
        const gid = request_payload.gid;

        const aggregator = new Aggregator(request_payload.app_id, request_payload.company_id);
        const redirectUrl = await aggregator.createOrder(request_payload);

        const responseData = {
            success: true,
            redirect_url: redirectUrl,
            gid: gid,
        }
        console.log("Response for create payment", responseData);
        return responseData;
    }

    async processCallback(request_payload) {
        console.log('Payload for process callback', request_payload);

        const gid = await Aggregator.getOrderFromCallback(request_payload);

        const aggregator = new Aggregator(request_payload.app_id, request_payload.company_id);
        const callbackResponse = await aggregator.processCallback(request_payload);

        const { amount, currency, status, payment_id } = callbackResponse;
        const payload = this.createPaymentUpdatePayload(gid, amount, currency, status, payment_id, request_payload);
        await this.updatePlatformPaymentStatus(request_payload.app_id, request_payload.company_id, gid, payload);

        // TODO: get redirect URL from custom meta field
        const redirectUrl = status == "complete" ? "https://www.google.com/search?q=success+url" : "cancel_url";

        const responseData = {
            action: "redirect",
            redirectUrl: encodeURIComponent(redirectUrl)
        };
        console.log('Callback response', responseData);
        return responseData;
    };

    async getRefundDetails(data) {
        console.log('[REQDATA] Request params/query for getRefundDetails::get', data);
        const forwardTransaction = await Transaction.findOne({ gid: data.gid });
        const order = await Order.findOne({ gid: data.gid });
        if (!forwardTransaction) {
            throw new NotFoundError("transaction for order " + data.gid);
        }

        const instance = await AggregatorFactory.createInstance({ appId: order.app_id });
        const aggResponse = await instance.getRefundDetails(data, data.gid, order.fynd_platform_id);
        const responseData = {
            gid: data.gid,
            journey_type: "refund",
            aggregator_payment_refund_details: aggResponse.refunds,
        };
        console.log('[RESDATA] Response for getRefundDetails::get', responseData);
        return responseData;
    };

    async processRefund(data) {
        // request:
        // {
        //     "gid": "<fynd_order_id>",
        //     "object": "refund",
        //     "request_id": "",
        //     "amount": amount in paise integer,
        //     "currency": "",
        //     "status": "initiate",
        //     "meta": {
        //         "payment_mode": "NB",
        //     }
        // }

        console.log('[REQDATA] Request body for processRefund::post', data);
        const payment_modes = jioRefundMopMapping[data.meta?.payment_mode] || [];
        payment_modes.push(data.meta.payment_mode);

        let transaction_ids = data.meta?.transaction_ids || [data.gid];

        let forwardTransaction = await Transaction.findOne({
            gid: { "$in": transaction_ids },
            journey_type: "forward",
            payment_mode: { "$in": payment_modes },
        });
        if (!forwardTransaction) {
            forwardTransaction = await Transaction.findOne({
                gid: { "$in": transaction_ids },
                journey_type: "forward",
                payment_mode: { "$nin": payment_modes },
            });
        }
        if (!forwardTransaction) {
            throw new NotFoundError("no transaction for payment_mode " + data.meta?.payment_mode);
        }
        const order = await Order.findOne({ gid: { "$in": transaction_ids } });

        if (forwardTransaction.current_status !== "complete" || !forwardTransaction.aggregator_payment_id) {
            throw new BadRequestError(
                "transaction pending aggregator {" + data.gid + "} current status: " + forwardTransaction.current_status
            );
        }
        data.meta.mop = forwardTransaction.payment_mode;
        data.meta.forwardTransactionId = forwardTransaction.fynd_platform_id;

        const existingRefund = await Transaction.findOne({
            refund_request_id: data.request_id,
            payment_mode: data.meta?.payment_mode,
            amount: data.amount,
        });

        if (existingRefund && existingRefund.current_status === "refund_done") {
            throw new BadRequestError(
                "duplicate refund request " + data.gid
            )
        }
        const orderData = order.meta.request;
        data.external_id = orderData?.meta?.external_id;
        data.customer_contact = orderData.meta?.customer_details?.mobile || orderData?.customer_contact;
        data.forwardPaymentId = forwardTransaction.aggregator_payment_id;
        data.invoiceNumber = forwardTransaction.invoice_no;
        data.g_user_id = forwardTransaction.g_user_id;
        data.fynd_platform_id = forwardTransaction.fynd_platform_id;

        const fdkExtension = await this.getFdkExtension();
        const platformClient = await fdkExtension.getPlatformClient(data.company_id);
        const { token } = await platformClient.application(data.app_id).configuration.getApplicationById();
        const applicationClient = await fdkExtension.getApplicationClient(data.app_id, token);

        const shipmentDetails = await applicationClient.order.getShipmentById({ shipmentId: data.request_id });
        console.log("[processRefund] Shipment Details", shipmentDetails);
        data.storeCode = shipmentDetails?.shipment?.fulfilling_store?.code;
        data.articleTags = shipmentDetails?.shipment?.bags?.[0]?.article?.tags;

        const instance = await AggregatorFactory.createInstance({ appId: order.app_id });
        const refundResponse = await instance.processRefund(data);
        const status_mapper = await getAggregatorStatusMapper(refundResponse.status, refundResponse.journeyType);

        const refundTransaction = await Transaction.create({
            gid: data.gid,
            fynd_platform_id: forwardTransaction.fynd_platform_id,
            g_user_id: forwardTransaction.g_user_id,
            aggregator_order_id: forwardTransaction.aggregator_order_id,
            aggregator_payment_id: forwardTransaction.aggregator_payment_id,
            refund_request_id: data.request_id,
            aggregator_refund_id: refundResponse.aggregatorActionId,
            amount: data.amount,
            current_status: status_mapper.status,
            journey_type: refundResponse.journeyType,
            payment_mode: data.meta?.payment_mode,
            reason: refundResponse.reason,
            status: [{
                status: status_mapper.status,
                meta: {
                    refundMeta: refundResponse.meta.response.data
                }
            }]
        });
        let payment_methods = []
        if (data.meta?.payment_mode) {
            payment_methods.push({
                code: data.meta?.payment_mode
            })
        } else {
            payment_methods.push(order.payment_methods)
        }

        const responseData = {
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
                payment_methods: payment_methods,
                success_url: order.meta.success_url,
                cancel_url: order.meta.cancel_url,
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
        console.log('[RESDATA] Response for processRefund::post', responseData);
        return responseData;
    };

    async processWebhook(webhookPayload) {
        console.log('Webhook request body', webhookPayload);
        let data = webhookPayload.data;
        const gid = await Aggregator.getOrderFromWebhook(data);

        const aggregator = new Aggregator({ app_id: data.app_id, company_id: data.company_id });
        const webhookResponse = await aggregator.processWebhook(webhookPayload);

        const { amount, currency, status, payment_id } = webhookResponse;
        const payload = this.createPaymentUpdatePayload(gid, amount, currency, status, payment_id, webhookPayload.data);
        await this.updatePlatformPaymentStatus(data.app_id, data.company_id, gid, payload);

        console.log("Webhook complete");
    }

    async getPaymentDetails(data) {
        console.log('Request for get payment details', data);

        // TODO: How to get app id and company_id here
        const aggregator = new Aggregator();
        const aggResponse = await aggregator.getOrderDetails(data.gid);
        const { amount, currency, status, payment_id } = aggResponse;

        const responseData = this.createPaymentUpdatePayload(data.gid, amount, currency, status, payment_id, aggResponse)
        console.log('Response for get Payment Details', responseData);
        return responseData;
    };

    createPaymentUpdatePayload(gid, amount, currency, status, payment_id, aggregatorResponse){
        return {
            "gid": gid,
            "order_details": {
                "gid": gid,
                "amount": amount,
                "status": status,
                "currency": currency,
                "aggregator_order_details": aggregatorResponse,
                "aggregator": "Dummy"
            },
            "status": status,
            "currency": currency,
            "payment_details": [{
                gid,
                amount,
                currency,
                payment_id: payment_id,
                mode: config.env,
                success_url: "",
                cancel_url: "",
                amount_captured: amount,
                payment_methods: [{}],
                g_user_id: "<User id if exists>",
                aggregator_order_id: payment_id,
                status: status,
            }],
            "total_amount": amount,
        }
    }

    async updatePlatformPaymentStatus(
        app_id,
        company_id,
        gid,
        payload
    ) {
        const checksum = getHmacChecksum(JSON.stringify(payload), config.api_secret);
        payload["checksum"] = checksum

        let platformClient = await fdkExtension.getPlatformClient(company_id);
        const applicationClient = platformClient.application(app_id);
        const sdkResponse = await applicationClient.payment.updatePaymentSession({ gid: gid, body: payload });
        return sdkResponse;
    }

    async processRefundWebhook(data) {
        /* sample webhook payload
            Webhook request data:
            refund Ok: {
                "success": true,
                "refundId": "TESTJIOGROCERY0028552",
                "transactionRefNumber": "TESTJIOGROCERY002812",
                "transactionDateTime": "2020-06-24T05:58:49",
                "transactionType": "REFUND",
                "channelId": "JIOGROCERIES",
                "paymentDetail": {
                    "totalAmount": "1.00",
                    "instrumentReference": "200624670001615017",
                    "instrumentDate": "2020-06-24T05:58:49"
                }
            }
        */
        console.log('[REQDATA] Request body for processRefundWebhook::post', data);
        const transaction = await Transaction.findOne({ refund_request_id: data.data.transactionRefNumber });
        const order = await Order.findOne({ gid: transaction.gid });

        const instance = await AggregatorFactory.createInstance({ appId: order.app_id });
        const webhookResponse = await instance.processRefundWebhook(data, transaction);
        await Transaction.updateOne(
            { refund_request_id: data.data.transactionRefNumber },
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
        const response = await this.updateGringottsRefundStatus(order, transaction, webhookResponse.status, data, "refund_webhook", webhookResponse.reason);
        console.log('[RESDATA] Response for processRefundWebhook::post', response);
    }

    async updateGringottsRefundStatus(order, transaction, status, data, source, reason = "") {
        // Call gringotts api
        order.billing_address.address_type = order.billing_address.address_type || "other";
        order.shipping_address.address_type = order.shipping_address.address_type || "other";
        const payload = {
            "gid": order.gid,
            "status": status,
            "total_amount": order.amount,
            "currency": order.currency,
            "refund_details": [{
                "request_id": transaction.refund_request_id,
                "amount": transaction.amount,
                "currency": order.currency,
                "refund_utr": data.refundId,
                "payment_id": transaction.aggregator_order_id,
                "status": status,
                "reason": reason,
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
                "amount_refunded": transaction.amount,
                "gid": order.gid,
                "g_user_id": transaction.g_user_id,
                "amount": order.amount,
                "currency": order.currency,
                "merchant_locale": order.meta.request.merchant_locale,
                "locale": order.meta.request.locale,
                "mode": order.meta.request.mode,
                "payment_methods": order.payment_methods,
                "success_url": order.meta.success_url,
                "cancel_url": order.meta.cancel_url,
                "billing_address": order.billing_address,
                "shipping_address": order.shipping_address,
                "kind": order.meta.request.kind,
                "created": String(Date.parse(order.createdAt)),
            },
        }

        const checksum = getHmacChecksum(JSON.stringify(payload), config.extension.api_secret);
        payload["checksum"] = checksum;
        const fieldsToMask = [];

        if (payload?.payment_details?.billing_address) {

            fieldsToMask.push(
                `payment_details.billing_address.area`,
                `payment_details.billing_address.name`,
                `payment_details.billing_address.city`,
                `payment_details.billing_address.address`,
                `payment_details.billing_address.pincode`,
                `payment_details.billing_address.area_code`,
                `payment_details.billing_address.state`
            )
        }

        if (payload?.payment_details?.shipping_address) {
            fieldsToMask.push(
                `payment_details.shipping_address.area`,
                `payment_details.shipping_address.name`,
                `payment_details.shipping_address.city`,
                `payment_details.shipping_address.address`,
                `payment_details.shipping_address.pincode`,
                `payment_details.shipping_address.area_code`,
                `payment_details.shipping_address.state`
            )
        }

        logger.mask(LOGGER_TYPE.info, fieldsToMask, "[FDKREQUEST] Updating Refund status on Gringotts", payload);

        const fdkExtension = await this.getFdkExtension();
        let platformClient = await fdkExtension.getPlatformClient(order.meta.request.company_id);
        const applicationClient = platformClient.application(order.app_id);
        const sdkResponse = await applicationClient.payment.updateRefundSession({ gid: order.gid, requestId: transaction.refund_request_id, body: payload });
        return sdkResponse;
    }
}

module.exports = AggregatorProcessor