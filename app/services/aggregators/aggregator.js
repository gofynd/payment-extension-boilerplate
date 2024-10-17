const config = require("../../config");
const { aggregatorConfig } = require("./config");
const { getCheckoutPayload, getCheckoutChecksum, getLinkPayload, getLinkChecksum } = require("./payloads");

class Aggregator {
    constructor(appId) {
        super();
        this.appId = appId;
    }

    async setAggregatorConfig(secrets) {
        // This function used to set the payment gateways configs
        this.secretsDict = secrets;
        this.channelId = secrets.channelId;
        this.circleId = secrets.circleId;
        this.transactionType = secrets.transactionType;
        this.checksum_key = secrets.checksum_key;
        this.refund_checksum_key = secrets.refund_checksum_key;
        this.payment_link = secrets.payment_link;
        this.api_domain = secrets.api_domain;
        this.encrypt_secret = secrets.encrypt_secret;
        this.encrypt_iv = secrets.encrypt_iv;
        this.link_expiry = secrets.link_expiry || 15;
        this.success_redirect_url = secrets.success_redirect_url;
        this.failed_redirect_url = secrets.failed_redirect_url;
        this.action = secrets.action;
    }


    async createOrder(data) {
        /*
        Sample createOrder API response
        {
            'linkId': 'e7811fa71cb048d58bf345d61e88743a',
            'success': true,
            'transactionRefNumber': ' JM000000001',
        }
        Returns:
        200CREATED {
            aggregatorOrderId: string,
            status: 'initiated',
            journeyType: 'forward',
            amount: float,
            action: 'redirect',
            url: URL that redirect to PG,
            aggregatorUserID: string,
            meta: {
                response: Dict
            }
        }
    
        400/500 {
            status: 'failed',
            journeyType: 'forward',
            amount: float,
            meta: {
                response: dict
            }
        }
    
        */

        let payload = {}
        let checksumValue = ""

        const customer = {
            customer_name: data.meta?.customer_details?.name || data.customer_name,
            customer_contact: data.meta?.customer_details?.mobile || data.customer_contact,
            customer_email: data.meta?.customer_details?.email || data.customer_email,
        }
        if (data.payment_methods?.some((method) => method?.code?.toUpperCase() == 'JIOPPLINK')) {
            payload = await getLinkPayload(data, this.secretsDict, customer);
            checksumValue = await getLinkChecksum(payload, this.secretsDict);
        } else {
            payload = await getCheckoutPayload(data, this.secretsDict, customer);
            checksumValue = await getCheckoutChecksum(payload, this.secretsDict);
        }
        const url = this.api_domain + aggregatorConfig.createOrder;
        const headers = {
            "X-JIO-PAYLOAD-AUTH": checksumValue,
            "ContentType": "application/json"
        };
        const logData = {
            purpose: "Creating Order",
            entityValue: payload.transactionRefNumber,
            entityName: "transactionRefNumber"
        }
        const response = await makeRequest({
            method: 'POST',
            url: url,
            data: payload,
            headers: headers,
            logData
        });
        if (response.status === httpStatus.OK) {

            let redirectInfo = {}
            let payment_methods = data.payment_methods;

            if (payment_methods.find((method) => method.code.toUpperCase() == 'JIOPPLINK')) {
                redirectInfo = {
                    action: ActionType.POLLING,
                    paymentLink: this.payment_link + `?transactionRefNumber=${data.gid}&channelId=${this.channelId}`,
                    pollingLink: removeTrailingSlash(config.extension.base_url) + '/api/v1/payment_update',
                    pollingData: {
                        gid: data.gid,
                        amount: data.amount,
                        _id: data._id
                    }
                }
            } else {
                redirectInfo = {
                    action: ActionType.HTMLSTRING,
                    htmlString: Buffer.from(response.data.htmlForm, 'base64').toString('utf-8')
                }
            }

            const orderResponse = {
                aggregatorOrderId: response.data.linkId,
                aggergatorPaymentId: response.data.linkId,
                status: "initiated",
                journeyType: "forward",
                amount: data.amount,
                redirectInfo: redirectInfo,
                aggregatorUserID: null,
                meta: {
                    request: { ...payload, ...headers },
                    response: response.data,
                    payment_complete_redirect_url: await this.createRedirectUrls(
                        data.fynd_platform_id,
                        data.gid
                    )
                }
            };
            return orderResponse;
        }
        return {
            aggregatorOrderId: data.gid,
            aggergatorPaymentId: null,
            status: "failed",
            journeyType: "forward",
            amount: data.amount,
            aggregatorUserID: null,
            meta: {
                request: { ...payload, ...headers },
                response: response
            }
        };
    }

    async createRedirectUrls(orderId, gid) {
        var redirectionUrls = {}
        if (this.success_redirect_url) {
            var successURL = new URL(this.success_redirect_url);

            const successParams = {
                "success": "true",
                "status": "complete",
                "order_id": orderId,
                "gid": gid,
                "aggregator_name": config.extension.aggregator_slug
            }

            for (var key in successParams) {
                successURL.searchParams.set(key, successParams[key]);
            }
            redirectionUrls.success_redirect_url = successURL.href;
        }
        if (this.success_redirect_url) {

            var failedURL = new URL(this.failed_redirect_url);

            const failedParams = {
                "success": "false",
                "status": "failed",
                "order_id": orderId,
                "gid": gid,
                "aggregator_name": config.extension.aggregator_slug
            }

            for (var key in failedParams) {
                failedURL.searchParams.set(key, failedParams[key]);
            }

            redirectionUrls.failed_redirect_url = failedURL.href;
        }

        return redirectionUrls;
    }

    // async getPaymentDetails(data) {
    //     const url = this.domain + '/' + aggregatorConfig.getPaymentDetails.replace(":id", data.aggregatorPaymentId);
    //     const headers = { "Authorization": this.secretKey };
    //     const aggResponse = await makeRequest({ method: "get", url: url, headers: headers });
    //     return aggResponse;
    // }

    async processCallback(requestPayload, order) {
        /*
        Jio server request paylaod:
        200: {
            "transactionType": "TIRA",
            "totalAmount": "6099.00",
            "transactionDateTime": "2022-03-22T13:51:26",
            "success": true,
            "transactionRefNumber": "FY623985BC0144065712",
            "channelId": "TIRA",
            "paymentDetail": [
                {
                    "sortId": 1,
                    "instrumentReference": "20220322111212800100168898424985946",
                    "amount": "6099.00",
                    "mop": "189",
                    "modeOfPayment": "Credit Card",
                    "modeOfPaymentDesc": "Credit Card",
                    "instrumentDate": "2022-03-22T13:51:26"
                }
            ]
        }
        ~200: {
            "success": false,
            "errors": [
                {
                    "code": "",
                    "reason": "",
                    "details": "Failed"
                }
            ],
            "transactionType": "TIRA",
            "totalAmount": "6099.00",
            "transactionDateTime": "2022-03-22T13:51:26",
            "transactionRefNumber": "FY623985BC0144065712",
            "channelId": "TIRA",
            "paymentDetail": [
                {
                    "amount": "6099.00"
                }
            ]
        }
        */

        const x_jio_payload_auth = requestPayload['X-JIO-PAYLOAD-AUTH'];
        let responseData = requestPayload.responseData;

        // Verify Checksum
        const checksum = await this.verifyChecksum(responseData, x_jio_payload_auth);

        // re-process and create offer list, this will avoid issue in checksum verificatioon
        let result = await this.createOfferList(responseData);
        requestPayload.responseData = result.data;
        responseData = requestPayload.responseData;
        let appliedPaymentOffers = result.appliedPaymentOffers;

        let statusMapper = null;
        if (!checksum) {  // checksum verification failed
            logger.error('Request Unauthorised, checksum mismatch');
            statusMapper = await getAggregatorStatusMapper("unverified", "forward");
        }
        else {
            // responseData = await this.confirmWebhookOrder(responseData.transactionRefNumber);
            // if (!responseData.success || response.statusMapper.status != 'complete') {  // call getOrderDetails API if webhook not confirmed
            //     let response = await this.getOrderDetails(responseData.transactionRefNumber);
            //     responseData = response.pgResponse;
            // }

            // Check the amount is same for not
            if (!responseData.success || responseData.errors) {
                statusMapper = await getAggregatorStatusMapper('failed', 'forward')
            }

            else if (
                (parseFloat(responseData?.totalAmount) != (order.amount / 100)) &&
                ((parseFloat(responseData?.totalAmount) + appliedPaymentOffers?.totalAppliedOfferAmount) != (order.amount / 100))
            ) {
                logger.error('Invalid request, amount does not match.');
                statusMapper = await getAggregatorStatusMapper('unverified', 'forward');
            }
            else if (responseData.success) {
                statusMapper = await getAggregatorStatusMapper('complete', 'forward');
            }
        }
        const paymentDetails = [];

        if (!statusMapper) {
            logger.error('Mapping for status not found.');
            statusMapper = await getAggregatorStatusMapper('unverified', 'forward')
        }

        responseData.paymentDetail.forEach((paymentDetail) => {
            paymentDetails.push({
                aggregatorTransactionId: paymentDetail?.instrumentReference,
                paymentMethods: [{
                    "code": paymentDetail?.modeOfPayment || order.meta.request?.payment_methods[0]["code"],
                    "name": paymentDetail?.modeOfPaymentDesc || order.meta.request?.payment_methods[0]["name"],
                    "meta": {
                        "mop": paymentDetail?.mop
                    }
                }],
                amount: Math.round(paymentDetail.amount * 100, 2),
                status: statusMapper?.status,
            })
        });
        return {
            'status': statusMapper.status,
            'paymentDetail': paymentDetails,
            'meta': responseData,
            'appliedPaymentOffers': appliedPaymentOffers
        };
    }

    async initiate_jio_refund(url, data) {
        /*
        Chxecksum Pattern:
            transactionRefNumber|transactionDateTime|paymentRefNumber|instrumentReference|totalAmount

        Sample API response
        // Changed in api v2
        {
            "code": 200,
            "refundId": "17900538649020039A757",
            "transactionRefNumber": "17900538649020039A"
        }
        */
        const callbackUrl = removeTrailingSlash(config.extension.base_url) + "/api/v1/webhook/refund";
        const payload = {
            'transactionRefNumber': data.request_id,
            'paymentRefNumber': data.meta.forwardTransactionId,
            'transactionDateTime': getISTDateTime(),
            'merchantId': this.channelId,
            'description': '',
            'characteristics': [{
                'name': 'CALLBACK_REF_NOTIFY_URL',
                'value': callbackUrl,
            }],
            'paymentDetail': {
                'totalAmount': `${(data.amount / 100).toFixed(2)}`,
                'currencyCode': data.currency,
                'modeOfPayment': data.payment_mode,
                'instrumentReference': data.forwardPaymentId
            },
        }

        payload['subMerchantName'] = data.articleTags.some(tag => tag.toLowerCase() === '3p') ? '3PVENDOR' : null;

        const checksum = `${this.channelId}|${payload.paymentDetail.totalAmount}|${payload.transactionRefNumber}|${payload.paymentRefNumber}|${payload.paymentDetail.instrumentReference}|${payload.transactionDateTime}`
        const headers = {
            'X-JIO-PAYLOAD-AUTH': getHmacChecksum(checksum, this.refund_checksum_key).toUpperCase()
        }

        const logData = {
            purpose: "initiating refund",
            entityName: "shipment_id",
            entityValue: payload.transactionRefNumber
        }

        const response = await makeRequest({
            method: "post",
            url: url,
            data: payload,
            headers: headers,
            logData
        });
        return response;
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

    async verifyChecksum(data, x_jio_payload_auth) {
        const success = data.success;
        const transactionRefNumber = data.transactionRefNumber;
        const totalAmount = data.totalAmount || data.paymentDetail.totalAmount;
        let message = '';

        if (data.transactionType.toUpperCase() == "REFUND") {
            message = `${transactionRefNumber}|${totalAmount}|${data.paymentDetail.instrumentReference}|${data.transactionDateTime}`;
        }
        else if (this.transactionType == "JMDASP") {
            const raw = data.paymentDetail.map(i => `${i.instrumentReference}|${i.amount}|${i.mop}`).join('|');
            message = `${success}|${transactionRefNumber}|${totalAmount}|${raw}`;
        }
        else {
            message = `${success}|${transactionRefNumber}|${totalAmount}`;
        }
        const calculatedChecksum = getHmacChecksum(message, this.checksum_key).toUpperCase();
        logger.debug(`Comparing calculated checksum: ${calculatedChecksum} with request checksum: ${x_jio_payload_auth}`);
        return calculatedChecksum === x_jio_payload_auth;
    }

    async createOfferList(data) {
        /*
        Sample Offer Data
        "appliedPaymentOffers": {
            "totalAppliedOfferAmount": 500,
            "offerList": [
                {
                "sortId": 2,
                "instrumentReference": "REDEEM-SUCCESS",
                "amount": "300.00",
                "mop": "337",
                "modeOfPayment": "337",
                "modeOfPaymentDesc": "Emi Discount",
                "instrumentDate": "2023-06-16T10:38:08",
                "offerId": "FANCEMI"
                },
                {
                "sortId": 3,
                "instrumentReference": "REDEEM-SUCCESS",
                "amount": "200.00",
                "mop": "315",
                "modeOfPayment": "315",
                "modeOfPaymentDesc": "Instant Discount",
                "instrumentDate": "2023-06-16T10:38:08",
                "offerId": "FANCEMI"
                }
            ]
        }
        */
        let totalAppliedOfferAmount = 0.0;
        let paidAmount = 0.0;
        const offerMops = ["207", "315"];
        const offerList = [];
        const updatedPaymentDetail = [];

        for (const paymentData of data.paymentDetail) {
            if (!offerMops.includes(paymentData.mop)) { // condition for payment mode
                updatedPaymentDetail.push(paymentData);
                paidAmount += parseFloat(paymentData.amount) || 0.0;
            } else { // condition for offer
                paymentData.amount = parseFloat(paymentData.amount) || 0.0;
                offerList.push(paymentData);
                totalAppliedOfferAmount += paymentData.amount;
            }
        }
        let appliedPaymentOffers = {
            totalAppliedOfferAmount: totalAppliedOfferAmount,
            offerList: offerList
        };

        data.appliedPaymentOffers = appliedPaymentOffers;
        data.totalAmount = paidAmount.toString();
        data.paymentDetail = updatedPaymentDetail;

        return { data, appliedPaymentOffers };
    }

    async processWebhook(requestPayload, order) {
        /*
        Jio server request paylaod:
        {
            'transactionType': 'TIRA',
            'totalAmount': '6099.00',
            'transactionDateTime': '2022-03-22T13:51:26',
            'success': true,
            'transactionRefNumber': 'FY623985BC0144065712',
            'channelId': 'TIRA',
            "offerdetails" {}
            'paymentDetail': [
                {
                    'sortId': 1,
                    'instrumentReference': '20220322111212800100168898424985946',
                    'amount': '6099.00',
                    'mop': '189',
                    'modeOfPayment': 'Credit Card',
                    'modeOfPaymentDesc': 'Credit Card',
                    'instrumentDate': '2022-03-22T13:51:26'
                }
            ]
        }
        Function returns {
            'statusMapper': 'complete',
            'aggregatorTransactionId': 'trxn_12345678',
            'paymentMethods': [{
                "code": 'NB',
                "name": 'Net Banking'
            }]
            'meta': {...}
        }
        */

        let data = requestPayload.data
        const x_jio_payload_auth = requestPayload.headers['x-jio-payload-auth']
        const isChecksumVerified = await this.verifyChecksum(data, x_jio_payload_auth)

        // re-process and create offer list, this will avoid issue in checksum verificatioon
        let result = await this.createOfferList(data);
        requestPayload.data = result.data;
        data = requestPayload.data
        let appliedPaymentOffers = result.appliedPaymentOffers;

        let statusMapper = {}
        // Verify Checksum
        if (!isChecksumVerified) {
            logger.error('Webhook unauthorised, checksum do not match');
            throw new AuthorizationError("Invalid Checksum");
        }
        else if (
            (parseFloat(data?.totalAmount) != (order.amount / 100)) &&
            ((parseFloat(data?.totalAmount) + appliedPaymentOffers?.totalAppliedOfferAmount) != (order.amount / 100))
        ) {
            logger.error('Invalid webhook, amount does not match.');
            throw new BadRequestError("Amount Mismatch");
        }
        else if (!data.success) {  // success = false then order failed
            logger.debug('Order failed as received failure response in webhook.');
            statusMapper = await getAggregatorStatusMapper("failed", "forward");
        }
        else if (data.paymentDetail.length === 1 && data.paymentDetail[0].instrumentReference === "REDEEM-FAILED") {
            logger.debug('Order failed as received failure response in webhook.');
            statusMapper = await getAggregatorStatusMapper("failed", "forward");
        }
        else {
            statusMapper = await getAggregatorStatusMapper('complete', 'forward');
            // Save into Redis
            await setRedisData(
                REDIS_ORDER_STATUS + data.transactionRefNumber,
                JSON.stringify({
                    'isWebhookProcessed': true,
                    'statusMapper': statusMapper,
                    'pgResponse': data,
                    'amount': data.totalAmount,
                    'transaction_id': tryOr(() => data.paymentDetail[0].instrumentReference, null)
                }),
                5 * 60
            );
        }

        const paymentDetails = [];
        data.paymentDetail.forEach((paymentDetail) => {
            paymentDetails.push({
                aggregatorTransactionId: paymentDetail.instrumentReference,
                invoiceNumber: paymentDetail.invoiceNumber,
                paymentMethods: [{
                    "code": paymentDetail?.modeOfPayment || order.meta.request?.payment_methods[0]["code"],
                    "name": paymentDetail?.modeOfPaymentDesc || order.meta.request?.payment_methods[0]["name"],
                    "meta": {
                        "mop": paymentDetail?.mop
                    }
                }],
                amount: Math.round(paymentDetail.amount * 100, 2),
                status: statusMapper.status,
            })
        });

        return {
            'status': statusMapper.status,
            'paymentDetail': paymentDetails,
            'meta': data,
            'appliedPaymentOffers': appliedPaymentOffers
        };
    }

    async processRefundWebhook(data, transaction) {
        /*
        Jio server request paylaod:
        {
            "success": true,
            "refundId": "TR64F8617F0ED022E3AF995",
            "transactionRefNumber": "16939996353471220750",
            "transactionDateTime": "2020-06-24T05:58:49",
            "transactionType": "REFUND",
            "channelId": "COVERSTORY",
            "paymentDetail": {
                "totalAmount": "230.00",
                "instrumentReference": "20230906011650000906225075626537245",
                "instrumentDate": "2020-06-24T05:58:49"
            }
        }
        Function returns {
            'statusMapper': 'complete',
            'aggregatorTransactionId': 'trxn_12345678',
            'paymentMode': 'NB',
            'meta': {...}
        }
        */

        const payload = data.data;
        if (_.isEmpty(payload)) {
            logger.error("Invalid/Empty refund webhook");
            throw new BadRequestError(`bad request payload: ${JSON.stringify(payload)}`);
        }
        const x_jio_payload_auth = data.headers['x-jio-payload-auth'];
        const isChecksumVerified = await this.verifyChecksum(payload, x_jio_payload_auth);
        let statusMapper = {};
        let reason = "";

        const totalAmount = payload.paymentDetail.totalAmount;
        const instrumentReference = payload.paymentDetail.instrumentReference;
        // Verify Checksum
        if (!isChecksumVerified) {
            logger.error('Refund webhook unauthorised, checksum do not match');
            throw new AuthorizationError("Invalid Checksum");
        }
        if (parseFloat(totalAmount) != (transaction.amount / 100)) {
            logger.error('Invalid refund webhook, amount does not match.');
            throw new BadRequestError("Amount Mismatch");
        }
        else if (!payload.success) {  // success = false then order failed
            logger.debug("Refund failed as received failure resonse in refund webhook");
            statusMapper = await getAggregatorStatusMapper(data.data.status, "refund");
            if (data.data?.errors && data.data.errors.length > 0) {
                const error = data.data.errors[0];
                reason = `${error.reason} - ${error.details}`;
            }
        }
        else {
            statusMapper = await getAggregatorStatusMapper(data.data.status, 'refund');
            reason = "Success";
            // Save into Redis
            await setRedisData(
                REDIS_ORDER_STATUS + data.transactionRefNumber,
                JSON.stringify({
                    'isWebhookProcessed': true,
                    'statusMapper': statusMapper,
                    'pgResponse': payload,
                    'amount': totalAmount,
                    'transaction_id': tryOr(() => instrumentReference, null)
                }),
                5 * 60
            );
        }

        return {
            'status': statusMapper.status,
            'aggregatorTransactionId': tryOr(() => instrumentReference, null),
            'meta': data,
            'reason': reason,
        };

    }

    async confirmWebhookOrder(gid) {
        let orderStatus = await getRedisData(REDIS_ORDER_STATUS + gid);

        if (!orderStatus) {
            return {
                'success': false,
                'statusMapper': await getAggregatorStatusMapper('PENDING', 'forward')
            }
        }
        else {
            orderStatus = JSON.parse(orderStatus)
        }
        if (!orderStatus.isWebhookProcessed) {
            return {
                'success': false,
                'statusMapper': await getAggregatorStatusMapper('PENDING', 'forward')
            }
        }
        else {
            return {
                'success': true,
                'statusMapper': orderStatus.statusMapper,
                'pgResponse': orderStatus.pgResponse,
                'amount': orderStatus.amount,
                'transaction_id': orderStatus.transaction_id
            }
        }
    }

    async paymentUpdateStatus(requestPayload, order) {
        /*
            function to update payment status from order ID.
            That function can ce used in polling.
            Arguments:
                requestPayload: {
                    'gid': 'FY000000012345',
                    'amount': 50000, // in paisa
                }
                order: Order object
        */
        // const apiResponse = await this.getOrderDetails(gid=requestPayload.gid)
        // if (!apiResponse.amount && requestPayload.amount != apiResponse.amount) {
        //     throw new Error('Amount not verified.')
        // }

        let response = await this.confirmWebhookOrder(requestPayload.gid);
        if (response.statusMapper?.status != 'complete') {
            let currentStatus = response.statusMapper;

            response = await this.getOrderDetails(requestPayload, requestPayload.gid);
            if (response.statusMapper.status == undefined)
                response.statusMapper = currentStatus;
        }
        const pgResponse = response.pgResponse;

        return {
            'success': true,
            'retry': (response.status || 'initiated') != 'complete',
            'status': tryOr(() => response.statusMapper.status, 'initiated'),
            'aggregatorTransactionId': tryOr(() => pgResponse.paymentDetail[0].instrumentReference, null),
            'paymentMode': tryOr(() => pgResponse.paymentDetail[0].modeOfPayment, null),
            'meta': pgResponse,
            'gid': requestPayload.gid
        };
    }

    async processCancelPayment(requestPayload, order) {

        let statusMapper = await getAggregatorStatusMapper("cancel", "forward");
        return {
            statusMapper: statusMapper,
            status: statusMapper.status,
            meta: {}
        }

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