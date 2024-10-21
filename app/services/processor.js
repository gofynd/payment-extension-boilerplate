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
        amount = amount * 100; // Convert to paise/cents before sending to platform
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
            "total_amount": amount,
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
                created: String(Date.now()),
            }],
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

    async createRefund(request_payload) {
        /*
        Refer this page for more info
        https://partners.fynd.com/help/docs/partners/extension/payments/building-payment-extension/refund-flow/initiateRefundSession

        Example Payload:
        {
            "gid": "TR67160B990EA2149E59",
            "request_id": "17294985400131760447",
            "app_id": "650182068a75e06863ecbb75",
            "amount": 33300,
            "currency": "INR",
            "mode": "live",
            "journey_type": "CANCELLED_CUSTOMER",
            "status": "initiate",
            "meta": {
                "payment_mode": "dummy_payments",
                "transaction_ids": [
                    "TR67160B990EA2149E59"
                ]
            },
            "company_id": 1987,
            "aggregator_order_id": "23409284357024800293403584934",
            "aggregator_payment_id": "23409284357024800293403584934"
        }
        */

        console.log('Request body for create refund', request_payload);

        const aggregator = new Aggregator();
        const refundResponse = await aggregator.createRefund(request_payload);

        const { amount, currency, request_id, gid } = request_payload;
        const { status, refund_utr, payment_id } = refundResponse;
        const responseData = {
            gid,
            aggregator_payment_refund_details: {
                status,
                amount,
                currency,
                request_id,
                refund_utr,
                payment_id,
            },
        };
        console.log('Response for create refund', responseData);
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


    async processRefundWebhook(webhookPayload) {
        console.log('Request body for Refund Webhook', webhookPayload);

        let data = webhookPayload.data;
        const request_id = await Aggregator.getOrderFromRefundWebhook(data);

        const aggregator = new Aggregator({ app_id: data.app_id, company_id: data.company_id });
        const webhookResponse = await aggregator.processRefundWebhook(webhookPayload);

        const { amount, currency, status, payment_id, refund_utr } = webhookResponse;
        const payload = this.createRefundUpdatePayload(request_id, amount, currency, status, payment_id, refund_utr, webhookPayload.data);
        await this.updatePlatformRefundStatus(data.app_id, data.company_id, request_id, request_id, payload);

        console.log('Response for Refund Webhook', response);
    }

    createRefundUpdatePayload(gid, amount, currency, status, payment_id, refund_utr, aggregator_payload) {
        return {
            gid: gid,
            status: status,
            currency: currency,
            total_amount: amount,
            refund_details: [{
                status: status,
                request_id: gid,
                payment_id: payment_id,
                refund_utr: refund_utr,
                amount: amount,
                currency: currency,
                created: String(Date.now())
            }],
            payment_details: {
                gid: gid,
                status: status,
                aggregator_order_id: "",
                payment_id: payment_id,
                mode: config.env,
                amount: amount,
                success_url: "",
                cancel_url: "",
                amount_captured: amount,
                payment_methods: [{}],
                g_user_id: "<User id if exists>",
                currency: currency,
                amount_refunded: amount,
                created: String(Date.now())
            },
            meta: aggregator_payload,
        }
    }

    async updatePlatformRefundStatus(app_id, company_id, gid, request_id, payload) {
        const checksum = getHmacChecksum(JSON.stringify(payload), config.api_secret);
        payload["checksum"] = checksum;

        let platformClient = await fdkExtension.getPlatformClient(company_id);
        const applicationClient = platformClient.application(app_id);
        const sdkResponse = await applicationClient.payment.updateRefundSession({ gid: gid, requestId: gid, body: payload });
        return sdkResponse;
    }
}

module.exports = AggregatorProcessor