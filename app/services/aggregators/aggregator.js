const config = require("../../config");
const { BadRequestError } = require("../../utils/errorUtils");
const { aggregatorConfig, paymentStatus, refundStatus } = require("./config");

class Aggregator {
    constructor(app_id, company_id) {
        this.app_id = app_id;
        this.company_id = company_id;
    }

    async setAggregatorConfig(secrets) {
        // This function used to set the payment gateways configs
        this.secretsDict = secrets;
        this.apiToken = secrets.api_token;
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
        const gid = webhookPayload.transactionReferenceId;
        return gid;
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

        const response = await axios.axios({
            method: 'POST',
            url: url,
            data: body,
            headers: headers
        });

        if (response.status === 200) {
            return response.payment_url;
        }
        throw new BadRequestError("Bad request")
    }


    async processCallback(callbackPayload) {
        /*
        Customize function as per callback payload
        */

        const amount = callbackPayload.amount;
        const currency = "INR";
        let status = null;

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
        else {
            status = paymentStatus.SUCCESS
        }

        return {
            amount,
            currency,
            status,
        };
    }

    async processRefund(data) {
        // request:
        // {
        //     'gid': '<fynd_order_id>',
        //     'object': 'refund',
        //     'request_id': '',
        //     'amount': amount in paise integer,
        //     'currency': '',
        //     'status': 'initiate'
        //     'meta': {
        //          'payment_mode': 'NB'
        //     }
        // }
        let response = null;
        let reason = 'Initiated Refund';
        console.log('[processRefund] Data received for refund', data);
        data.payment_mode = data.meta?.payment_mode;
        data.mop = data.meta.mop;

        if (
            ['RONE', 'PERFIOS', 'JM_WALLET', 'JMWALLET', 'GIFT_CARD', 'GIFTCARD', 'EGV'].includes(data.payment_mode.toUpperCase())
        ) {
            response = await createWalletRefund(data, this.secretsDict)
        } else {
            response = await this.initiate_jio_refund(this.api_domain + aggregatorConfig.refund, data)
        }
        if (response.status === httpStatus.OK && response?.data?.code === 200) {
            const refundResponse = {
                aggregatorActionId: response.data.refundId,
                status: response?.data?.refund_status || 'refund_pending',
                journeyType: 'refund',
                amount: data.amount,
                requestId: data.request_id,
                reason: reason,
                meta: {
                    response: response.data
                }
            };
            return refundResponse;
        } else if (response.success === false && response.errors && response.errors.length > 0) {
            if (Array.isArray(response.errors)) {
                reason = `${error.reason} - ${error.details}`;
            } else {
                reason = response.errors;
            }
        }
        return {
            status: response?.data?.refund_status || 'refund_failed',
            journeyType: 'refund',
            amount: data.amount,
            requestId: data.request_id,
            reason: reason,
            meta: {
                response: response
            }
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

        const amount = webhookPayload.amount;
        const currency = "INR";
        let status = null;

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
        else if(webhookPayload.status === "pending"){
            status = paymentStatus.PENDING;
        }
        else {
            status = paymentStatus.SUCCESS;
        }

        return {
            amount,
            currency,
            status,
        };
    }

    async getOrderDetails(data, gid, fynd_platform_id, aggregatorOrderId = null) {
        /*
        get currect details of given order.
        Sample API Response
        200Ok: {
            'channelId': 'JIOGROCERIES',
            'transactionType': 'JIOGROCERIES',
            'transactionRefNumber': '16512181450000076A',
            'status': 'SUCCESS/PENDING/FAILED',
            'totalAmount': '420.00',
            'transactionDateTime': '2022-04-29T13:20:03',
            'message': 'success',
            'paymentDetail': [
                {
                    'sortId': 1,
                    'instrumentReference': '12345679',
                    'amount': '420.00',
                    'mop': '187',
                    'modeOfPayment': '23',
                    'modeOfPaymentDesc': 'UPI',
                    'instrumentDate': '2022-04-25T16:51:03'
                }
            ]
        }
        400 BadRequest:{
            'channelId': 'JIOGROCERIES',
            'transactionType': 'JIOGROCERIES',
            'transactionRefNumber': '16512181450000076A',
            'status': 'PENDING/FAILED',
            'totalAmount': '420.00',
            'transactionDateTime': '2022-04-29T13:20:03',
            'message': 'Declined by bank',
            'paymentDetail': []
        }
    
        */

        const payload = {
            "transactionDateTime": getISTDateTime(),
            "paymentRefNumber": fynd_platform_id,
            "merchantId": this.channelId,
            "businessFlow": this.transactionType
        }

        const message = `${payload.paymentRefNumber}|${payload.merchantId}|${payload.businessFlow}|${payload.transactionDateTime}`
        const headers = {
            'X-JIO-PAYLOAD-AUTH': getHmacChecksum(message, this.checksum_key).toUpperCase()
        }
        const url = this.api_domain + aggregatorConfig.orderStatus
        const logData = {
            purpose: "fetching order status",
            entityName: "order id",
            entityValue: payload.paymentRefNumber
        }
        const response = await makeRequest({
            method: 'POST',
            url: url,
            data: payload,
            headers: headers,
            logData
        });

        let responseData = null;
        let statusMapper = null;
        if (response.status == httpStatus.OK && !response.code) {
            responseData = response.data
            statusMapper = await getAggregatorStatusMapper(responseData.status, "forward");
        }

        let paymentDetails = [];
        if (statusMapper.status == 'complete') {
            response.data.paymentDetail.forEach(paymentDetail => {
                paymentDetails.push({
                    aggregatorTransactionId: paymentDetail.instrumentReference,
                    status: statusMapper.status,
                    invoiceNumber: paymentDetail.invoiceNumber,
                    paymentMethods: [{
                        "code": paymentDetail?.modeOfPayment || order.meta.request?.payment_methods[0]["code"],
                        "name": paymentDetail?.modeOfPaymentDesc || order.meta.request?.payment_methods[0]["name"],
                        "meta": {
                            "mop": paymentDetail?.mop
                        }
                    }],
                    amount: Math.round(paymentDetail.amount * 100, 2),
                })
            });
        }

        return {
            'success': (response.status == httpStatus.OK) && responseData.success,
            'amount': parseFloat(responseData.totalAmount),
            'transaction_id': tryOr(() => responseData.paymentDetail[0].instrumentReference, null),
            'pg_response': responseData,
            'status': statusMapper.status,
            'order_id': gid,
            'paymentDetails': paymentDetails
        }
    }

    async getRefundDetails(data, gid, fynd_platform_id, aggregatorOrderId = null) {
        /*
        get currect details of given order.
        Sample API Response:
        200: {
            "success": true,
            "paymentRefNumber": "16806106980000372M",
            "instrumentReference": "20230404011640000850068625351118848",
            "orderAmount": "102.00",
            "refunds":[
                {
                    "refundStatus": "FAILURE",
                    "refundId": "16806106980000372M524",
                    "transactionRefNumber": "16806106980000372M_29006",
                    "refundDateTime": "2023-04-04T00:00:00",
                    "arn": "",
                    "paymentDetail": {
                        "refundAmount": "102.00",
                        "pgName": "PAYTMPG"
                    }
                },
                {
                    "refundStatus": "PENDING",
                    "refundId": "16806106980000372M634",
                    "transactionRefNumber": "16806106980000372M_29016",
                    "refundDateTime": "2023-04-04T00:00:00",
                    "arn": "",
                    "paymentDetail": {
                        "refundAmount": "102.00",
                        "pgName": "PAYTMPG"
                    }
                }
            ]
        }
        400: {
            "success": false,
            "errors": [{
                "reason": "Missing required parameter.",
                "code": "1005",
                "details": "Request parameters cannot be empty.[paymentRefNumber]"
            }]
        }
        */

        const payload = {
            "transactionDateTime": getISTDateTime(),
            "paymentRefNumber": fynd_platform_id,
            "merchantId": this.channelId,
            "businessFlow": this.transactionType
        }
        const message = `${payload.paymentRefNumber}|${payload.merchantId}|${payload.businessFlow}|${payload.transactionDateTime}`;
        const headers = {
            'X-JIO-PAYLOAD-AUTH': getHmacChecksum(message, this.checksum_key).toUpperCase()
        }
        const url = this.api_domain + aggregatorConfig.refundStatus;
        const logData = {
            purpose: "fetching refund details",
            entityName: "order id",
            entityValue: payload.paymentRefNumber
        }
        const response = await makeRequest({
            method: 'post',
            url: url,
            data: payload,
            headers: headers,
            logData
        });

        let responseData = null;
        let statusMapper = await getAggregatorStatusMapper("", "refund");
        const refunds = [];

        if (response.status == httpStatus.OK || response.data.status) {
            responseData = response.data
            statusMapper = await getAggregatorStatusMapper(responseData.status, "forward");

            responseData.refunds.forEach(refund => {
                const statusMapper = getAggregatorStatusMapper(refund.refundStatus, 'refund');
                refunds.push({
                    "request_id": refund.transactionRefNumber,
                    "amount": refund.refundAmount * 100,
                    "status": statusMapper.status,
                    "currency": "INR",
                    "refund_utr": refund.refundId,
                    "payment_id": refund.refundId,
                    "reason": statusMapper.journeyType,
                    "receipt_number": refund.arn,
                    "transfer_reversal": "",
                    "source_transfer_reversal": "",
                    "created": refund.refundDateTime,
                    "balance_transaction": ""
                })
            });
        }
        else {
            throw new Error("Error while fetching refund status " + JSON.stringify(response.data.error));
        }

        return {
            'success': (response.status == httpStatus.OK) && responseData.success,
            'amount': parseFloat(responseData.totalAmount),
            'refunds': responseData.refunds,
            'pg_response': responseData,
            'gid': gid,
        }
    }
}

module.exports = Aggregator;