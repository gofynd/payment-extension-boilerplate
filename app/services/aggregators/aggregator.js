const Base = require("./base");
const { getAggregatorStatusMapper, makeRequest, getRedisData, setRedisData, tryOr } = require("../../utils/aggregatorUtils");
const { getHmacChecksum } = require("../../utils/signatureUtils");
const { getISTDateTime, calculateTimeDelta } = require("../../utils/dateUtils");
const logger = require("../../common/logger");

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

    async processShipmentUpdate(payload) {
        /*
        update shipment delivery status
        Sample Payload: {
            "platform_order_id": "FY435678123AD987",
            "gid": "TR64D4E4250DB0CBEF1D",
            "shipment_id": "16916747740991418099",
            "status": "delivery",
            "delivered_amount": 23000,
            "currency": "INR",
            "invoice_no": "89765413213412",
            "delivery_timestamp": "1623456789"  
        }
        Sample Function response
        200Ok:{
            "status": true,
            "gid": "TR64D4E4250DB0CBEF1D",
            "shipment_id": "16916747740991418099",
            "delivery_status": "delivered",
            "delivered_date": "123456789",
            "message": "Delivered Successfully",
        }
        400 BadRequest :{
            "status": false,
            "gid": "TR64D4E4250DB0CBEF1D",
            "shipment_id": "16916747740991418099",
            "delivery_status": "delivered",
            "delivered_date": "123456789",
            "message": "Status update failed",
        }
         */
    }

    async validateCustomer(payload) {
        /*
        validate customer
        Sample Payload: {
            "payload": "hashed_encoded_payload",
            "order_items": [
                    {
                    "sku": "1",
                    "price": 100,
                    "quantity": 1
                    }
                ],
            "delivery_address": {
                "line1": "string",
                "line2": "string",
                "city": "string",
                "state": "string",
                "country": "string",
                "pincode": "string",
                "type": "string",
                "geoLocation": {
                    "latitude": "string",
                    "longitude": "string"
                    }
                },
            "billing_address": {
                "line1": "string",
                "line2": "string",
                "city": "string",
                "state": "string",
                "country": "string",
                "pincode": "string",
                "type": "string",
                "geoLocation": {
                "latitude": "string",
                "longitude": "string"
                    }
                },
            "aggregator": "Simpl",
            "phone_number": "9876543210",
            "merchant_params": {"dummy": "lorem"},
            "transaction_amount_in_paise": 9128,
            "app_id": app_id
        }
        Sample Function response
        200Ok:{
            'success': true,
            'data': {
                'approved': true,
                'amount': 550
            }
            'message': 'Validated'
        }
        400 BadRequest:{
            'success': false,
            'data': {
                'approved': false,
                'amount': 550
            }
            'message': 'Validation Failed'
        }
         */
    }
}

module.exports = Aggregator;
