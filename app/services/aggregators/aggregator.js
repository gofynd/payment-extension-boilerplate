const Base = require("./base");
const { getAggregatorStatusMapper, makeRequest, getRedisData, setRedisData, tryOr } = require("../../utils/aggregatorUtils");
const { getHmacChecksum } = require("../../utils/signatureUtils");
const { getISTDateTime, calculateTimeDelta } = require("../../utils/dateUtils");
const logger = require("../../common/logger");
const {aggregatorConfig, config} = require("../../config");
const { ActionType, httpStatus } = require("../../../constants");
const EncryptHelper = require("../../utils/encryptUtils");
const removeTrailingSlash = require("../../utils/commonUtils");

class Aggregator extends Base {
    constructor(appId) {
        super();
        this.appId = appId;
    }

    async setAggregatorConfig(secrets) {
        // This function used to set the payment gateways configs
        this.secretsDict = secrets;
        this.api_domain = secrets.api_domain
    }


    async createOrder(data) {
        /*
        Returns:
        200 CREATED {
            aggregatorOrderId: string,
            status: 'initiated',
            journeyType: 'forward',
            amount: integer in paise,
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

        logger.info('createOrder payload: %O', JSON.stringify(data))

        // const response = await makeRequest({ method: 'POST', url: url, data: payload, headers: headers });
        // logger.info('Https Status: ', response.status);
        // example for success response - 
        // return {
            // aggregatorOrderId: response.order_id,
            // status: "",
            // journeyType: "",
            // amount: in paise,
            // action: 'redirect',
            // url: "pg_url",
            // aggregatorUserID: string,
            // meta: {
            //     response: Dict
            // }
        // }
    }

    async processCallback(requestPayload, order) {
        /*
        Process call back from PG.
        returns 
        {
            'status': statusMapper.status,
            'aggregatorTransactionId': responseData.paymentDetail[0].instrumentReference,
            'paymentMode': responseData.paymentDetail[0].modeOfPayment,
            'meta': responseData
        };
        */

        // return {
        //     'status': statusMapper.status,
        //     'aggregatorTransactionId': responseData.paymentDetail[0].instrumentReference,
        //     'paymentMode': responseData.paymentDetail[0].modeOfPayment,
        //     'meta': responseData
        // };
    }

    async processRefund(data) {
        // request:
        // {
        //     'gid': '',
        //     'object': 'refund',
        //     'request_id': '',
        //     'amount': amount in paise integer,
        //     'currency': '',
        //     'status': 'initiate'
        // }


        // const response = await makeRequest({ method: "post", url: url, data: payload, headers: headers })

        // return {
        //     status: 'refund_failed',
        //     journeyType: 'refund',
        //     amount: data.amount,
        //     requestId: data.request_id,
        //     meta: {
        //         response: response
        //     }
        // };
    }

    async processWebhook(requestPayload, order) {
        /*
        returns {
            'statusMapper': {status: 'complete', aggregatorStatus: "complete"},
            'aggregatorTransactionId': 'trxn_12345678',
            'paymentMode': 'NB',
            'meta': {...}
        }
        */

        logger.info("| Webhook | payload: %O", JSON.stringify(requestPayload));

        // return {
        //     'status': statusMapper.status,
        //     'aggregatorTransactionId': tryOr(() => data.transactionId, null),
        //     'paymentMode': tryOr(() => data.paymentDetail[0].modeOfPayment, null),
        //     'meta': data.data
        // };
    }

    async processRefundWebhook(requestPayload, transaction) {
        /*
        Function returns {
            'statusMapper': 'complete',
            'aggregatorTransactionId': 'trxn_12345678',
            'paymentMode': 'NB',
            'meta': {...}
        }
        */
        
        // return {
        //     'status': statusMapper.status,
        //     'aggregatorTransactionId': tryOr(() => instrumentReference, null),
        //     'meta': data
        // };

    }

    async getOrderDetails(data, gid, aggregatorOrderId=null) {
        /*
        get currect details of given order.
        Sample Function Response
        200Ok: {
            'success': responseData.success,
            'amount': responseData.totalAmount,
            'transaction_id': tryOr(() => responseData.paymentDetail[0].instrumentReference, null),
            'pg_response': responseData,
            'status': statusMapper?.status,
            'statusMapper': statusMapper,
            'order_id': gid,
        }
        400 BadRequest:{
            'status': 'PENDING/FAILED',
            'totalAmount': '420.00',
            'transactionDateTime': '2022-04-29T13:20:03',
            'message': 'Declined by bank',
            'paymentDetail': []
        }
    
        */
        // responseData = <api_response>
        // return {
        //     'success': responseData.success,
        //     'amount': responseData.totalAmount,
        //     'transaction_id': tryOr(() => responseData.transactionId, null),
        //     'pg_response': responseData,
        //     'status': statusMapper?.status,
        //     'statusMapper': statusMapper,
        //     'order_id': gid,
        // }
    }
}

module.exports = Aggregator;
