const axios = require('axios');
const config = require("../../config");
const { BadRequestError } = require("../../utils/errorUtils");
const { aggregatorConfig, paymentStatus, refundStatus } = require("./config");

class Aggregator {
    constructor(app_id, company_id) {
        this.app_id = app_id;
        this.company_id = company_id;
    }

    static async getOrderFromCallback(callbackPayload){
        const gid = callbackPayload.transactionReferenceId;
        return gid;
    }

    static async getOrderFromWebhook(webhookPayload){
        const gid = webhookPayload.transactionReferenceId;
        return gid;
    }

    static async getOrderFromRefundWebhook(webhookPayload){
        // Splitting both here from transaction id
        const orderIdCombined = webhookPayload.transactionReferenceId;
        const gid = orderIdCombined.split("-")[0];
        const request_id = orderIdCombined.split("-")[1];
        return {gid, request_id};
    }

    async createOrder(payload) {
        /*
        Returns: redirect_url for payment page
        */

        const customerData = {
            customer_name: payload.customer_name,
            customer_contact: payload.customer_contact,
            customer_email: payload.customer_email,
        }
        const callback_url = config.base_url + `api/v1/callback/${this.company_id}/${this.app_id}`;

        const body = {
            // Create payment gateway specific body here
            amount: payload.amount,
            currency: payload.currency,
            transactionReferenceId: payload.gid,
            customer: customerData,
            callback_url,
            address: payload.billing_address,
        }

        const url = config.pgBaseUrl + aggregatorConfig.createOrder;

        const headers = {
            "ContentType": "application/json"
        };

        const response = await axios.post({
            method: 'POST',
            url: url,
            data: body,
            headers: headers
        });
        // Demo response from payment gateway
        // const response = {
        //     status: 200,
        //     payment_url: "https://api.razorpay.com/accept-payment/pay_id_1234567890/"
        // }

        if (response.status === 200) {
            return response.data.payment_url;
        }
        throw new BadRequestError("Bad request")
    }


    async createRefund(request_payload) {
        const { aggregator_payment_id: forwardPaymentId, gid, request_id, amount, currency } = request_payload;

        const orderIdCombined = `${gid}-${request_id}`
        // Prepare payload for refund
        const payload = {
            amount: {
                value: amount / 100,
                currency_code: currency,
            },
            invoice_id: orderIdCombined,
        };
    
        // Generate refund URL
        const url = config.pgBaseUrl + '/v2/payments/captures/' + forwardPaymentId + '/refund';

        const response = await axios.post({
            method: "POST",
            url: url,
            data: payload,
        });
        // Demo refund initiate response
        // const response = {
        //     success: true,
        //     refund_utr: "ICIC2098423058020",
        //     refund_id: "890342354509842",
        // }

        if(response.status === 200){
            return {
                status: refundStatus.INITIATED,
                refund_utr: response.data.refund_utr,
                payment_id: response.data.refund_id,
            }
        }

        return {
            status: refundStatus.FAILED,
        }

    }

    async processCallback(callbackPayload) {
        /*
        Customize function as per callback payload
        */

        const amount = callbackPayload.amount;
        const currency = "INR";
        let status = null;
        let payment_id = null;

        // Verify Callback
        const checksum = await this.verifyChecksum(callbackPayload);

        if (!checksum) {  // checksum verification failed
            console.log('Request Unauthorised, checksum mismatch');
            status = paymentStatus.FAILED;
            return {
                amount,
                currency,
                status,
            };
        }
        else if(callbackPayload.status === "PAYMENT_COMPLETE"){
            status = paymentStatus.COMPLETE;
            payment_id = callbackPayload.transaction_id;
        }

        console.log("Callback return value", {amount, currency, status})
        return {
            amount,
            currency,
            status,
            payment_id,
        };
    }


    async verifyChecksum(payload) {
        // Add logic to verify callback and webhook
        return true;
    }

    async processWebhook(webhookPayload) {
        /*
        Customize function as per webhook payload
        */

        const amount = webhookPayload.data.amount;
        const currency = "INR";
        let status = null;
        let payment_id = null;

        // Verify webhook
        const checksum = await this.verifyChecksum(webhookPayload);

        if (!checksum) {  // checksum verification failed
            console.log('Request Unauthorised, checksum mismatch');
            status = paymentStatus.FAILED;
            return {
                amount,
                currency,
                status,
            };
        }
        else if(webhookPayload.data.status === "PAYMENT_PENDING"){
            status = paymentStatus.PENDING;
        }
        else {
            status = paymentStatus.COMPLETE;
            payment_id = webhookPayload.data.payment_id;
        }

        console.log("Webhook return value", {amount, currency, status})
        return {
            amount,
            currency,
            status,
            payment_id,
        };
    }

    async getOrderDetails(gid) {

        let amount;
        let currency = "INR";
        let status = null;
        let payment_id = null;

        const url = config.pgBaseUrl + aggregatorConfig.orderStatus + "/" + gid;

        const headers = {
            "ContentType": "application/json"
        };

        const response = await axios.get({
            method: 'GET',
            url: url,
            headers: headers
        });
        // Demo response from payment gateway
        // const response = {
        //     status: 200,
        //     payment_status: "PAYMENT_COMPLETE",
        //     currency: "INR",
        //     amount: "100.00",
        //     transaction_id: "20230404011640000850068625351118848",
        // }

        if(response.status === 200){
            if(response.data.payment_status === "PAYMENT_COMPLETE"){
                status = paymentStatus.COMPLETE;
                payment_id = response.data.transaction_id;
                amount = response.data.amount;
            }
            else if(response.data.payment_status === "PAYMENT_PENDING"){
                status = paymentStatus.PENDING;
                payment_id = response.data.transaction_id;
                amount = response.data.amount;
            }
            else{
                status = paymentStatus.FAILED
            }
        }

        console.log("Status return value", {amount, currency, status})
        return {
            amount,
            currency,
            status,
            payment_id,
        };
    }

    async processRefundWebhook(webhookPayload) {
        /*
        Customize function as per webhook payload
        */

        const amount = webhookPayload.data.amount;
        const currency = "INR";
        let status = null;
        let payment_id = null;
        let refund_utr = null;

        // Verify webhook
        const checksum = await this.verifyChecksum(webhookPayload);

        if (!checksum) {  // checksum verification failed
            console.log('Request Unauthorised, checksum mismatch');
            status = refundStatus.FAILED;
            return {
                amount,
                currency,
                status,
            };
        }
        else if(webhookPayload.data.status === "REFUND_PENDING"){
            status = refundStatus.PENDING;
        }
        else {
            status = refundStatus.COMPLETE;
            payment_id = webhookPayload.data.payment_id;
            refund_utr = webhookPayload.data.refund_utr;
        }

        console.log("Webhook return value", {amount, currency, status})
        return {
            amount,
            currency,
            status,
            payment_id,
            refund_utr,
        };
    }

    async getRefundDetails(gid) {

        let amount;
        const currency = "INR";
        let status = null;
        let payment_id = null;
        let refund_utr = null;

        const url = config.pgBaseUrl + aggregatorConfig.refundStatus + "/" + gid;

        const headers = {
            "ContentType": "application/json"
        };

        const response = await axios.get({
            method: 'GET',
            url: url,
            headers: headers
        });
        // Demo response from payment gateway
        // const response = {
        //     status: 200,
        //     refund_status: "REFUND_COMPLETE",
        //     currency: "INR",
        //     amount: "100.00",
        //     transaction_id: "20230404011640000850068625351118848",
        //     refund_utr: "ICICI0982435028943"
        // }

        if(response.status === 200){
            if(response.data.refund_status === "REFUND_COMPLETE"){
                status = refundStatus.COMPLETE;
                payment_id = response.data.transaction_id;
                amount = response.data.amount;
                refund_utr = response.data.refund_utr;
            }
            else if(response.data.refund_status === "REFUND_PENDING"){
                status = refundStatus.PENDING;
                payment_id = response.data.transaction_id;
                amount = response.data.amount;
            }
            else{
                status = refundStatus.FAILED
            }
        }

        console.log("Status return value", {amount, currency, status})
        return {
            amount,
            currency,
            status,
            payment_id,
            refund_utr,
        };
    }
}

module.exports = Aggregator;