const axios = require('axios');
const Aggregator = require("../services/aggregators/aggregator")

jest.mock('axios')

describe('Aggregator Instance', () => {
    let aggregator;

    beforeEach(() => {
        aggregator = new Aggregator();
    })

    test('createOrder', async () => {
        const requestPayload = {
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
        const pg_response = {
            status: 200,
            data: {
                payment_url: 'https://pg-url.com/payments/payment_id_001',
            }
        };

        axios.post.mockResolvedValue(pg_response);

        const response = await aggregator.createOrder(requestPayload);

        expect(response).toEqual(pg_response.data.payment_url);
    })

    test('createRefund', async () => {
        const requestPayload = {
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
        const pg_response = {
            status: 200,
            data: {
                success: true,
                refund_utr: "ICIC2098423058020",
                refund_id: "890342354509842",
            }
        }

        axios.post.mockResolvedValue(pg_response);

        const response = await aggregator.createRefund(requestPayload);

        expect(response).toHaveProperty('status', 'refund_initiated');
        expect(response).toHaveProperty('refund_utr', pg_response.data.refund_utr);
        expect(response).toHaveProperty('payment_id', pg_response.data.refund_id);
    })

    test('getOrderDetails', async () => {
        const gid = "TR890343598520198";
        const pg_response = {
            status: 200,
            data: {
                payment_status: "PAYMENT_COMPLETE",
                currency: "INR",
                amount: "100.00",
                transaction_id: "20230404011640000850068625351118848",
            }
        }

        axios.get.mockResolvedValue(pg_response);

        const response = await aggregator.getOrderDetails(gid);

        console.log(response)
        expect(response).toHaveProperty('amount');
        expect(response).toHaveProperty('currency');
        expect(response).toHaveProperty('status', 'complete');
        expect(response).toHaveProperty('payment_id', pg_response.data.transaction_id);
    })

    test('getRefundDetails', async () => {
        const gid = "TR8903435985201982";
        const pg_response = {
                status: 200,
                data: {
                    refund_status: "REFUND_COMPLETE",
                    currency: "INR",
                    amount: "100.00",
                    transaction_id: "20230404011640000850068625351118848",
                    refund_utr: "ICICI0982435028943"
                }
            }

        axios.get.mockResolvedValue(pg_response);

        const response = await aggregator.getRefundDetails(gid);

        console.log(response)
        expect(response).toHaveProperty('amount');
        expect(response).toHaveProperty('currency');
        expect(response).toHaveProperty('status', 'refund_done');
        expect(response).toHaveProperty('payment_id', pg_response.data.transaction_id);
        expect(response).toHaveProperty('refund_utr', pg_response.data.refund_utr);
    })
})

