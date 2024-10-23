const AggregatorProcessor = require("../services/processor")
const Aggregator = require("../services/aggregators/aggregator")

jest.mock('../fdk', () => ({
    fdkExtension: {
        getPlatformClient: jest.fn().mockResolvedValue({
            application: () => ({
                payment: {
                    updatePaymentSession: jest.fn().mockResolvedValue({success:"true"}),
                    updateRefundSession: jest.fn().mockResolvedValue({success:"true"}),
                },
            }),
        }),
    },
}));

jest.mock("../models/model", () => ({
    Order: {
        create: jest.fn().mockResolvedValue(() => true),
        findOne: jest.fn().mockResolvedValue({
            success_url: "success_url",
            cancel_url: "cancel_url",
        })
    }
}))



describe('Aggregator Processor', () => {
    let aggregatorProcessor;

    beforeEach(() => {
        aggregatorProcessor = new AggregatorProcessor();
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
        const expectedResponse = {
            success: true,
            redirect_url: 'https://pg-url.com/payments/payment_id_001',
            gid: 'TR662637B30D570001',
        };

        Aggregator.prototype.createOrder = jest.fn().mockResolvedValue(expectedResponse.redirect_url);

        const response = await aggregatorProcessor.createOrder(requestPayload);

        expect(response).toEqual(expectedResponse);
        expect(Aggregator.prototype.createOrder).toHaveBeenCalledWith(requestPayload);
    })

    test('getPaymentDetails', async () => {
        Aggregator.prototype.getOrderDetails = jest.fn().mockResolvedValue({
            amount: 100,
            currency: "INR",
            status: "pending",
            payment_id: "pay_1234",
        });

        const response = await aggregatorProcessor.getPaymentDetails({gid: "TR8273429127187"});
        expect(response).toHaveProperty('gid');
        expect(response).toHaveProperty('order_details');
        expect(response).toHaveProperty('status');
        expect(response).toHaveProperty('currency');
        expect(response).toHaveProperty('total_amount');
        expect(response).toHaveProperty('payment_details');
    })

    test('processCallback', async () => {
        const request_payload = {
            headers: {
                checksum: "X0324893URITEH029843"
            },
            data: {
                "amount": 33.0,
                "transactionReferenceId": "TR6715E8860ED31137D4",
                "transaction_id": "pay_20894ruflor20",
                "status": "PAYMENT_COMPLETE"
            }
        }
        Aggregator.prototype.processCallback = jest.fn().mockResolvedValue({
            amount: 100,
            currency: "INR",
            status: "pending",
            payment_id: "pay_1234",
        });

        const response = await aggregatorProcessor.processCallback(request_payload);
        expect(response).toHaveProperty('redirectUrl')
    })

    test('processWebhook', async () => {
        const webhookPayload = {
            headers: {
                checksum: "X0324893URITEH029843"
            },
            data: {
                "amount": 33.0,
                "transactionReferenceId": "TR6715E8860ED31137D4",
                "transaction_id": "pay_20894ruflor20",
                "status": "PAYMENT_COMPLETE"
            }
        }
        Aggregator.prototype.processWebhook = jest.fn().mockResolvedValue({
            amount: 100,
            currency: "INR",
            status: "pending",
            payment_id: "pay_1234",
        });

        const response = await aggregatorProcessor.processWebhook(webhookPayload);
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
        const refundResponse = {
            status: "refund_initiated",
            refund_utr: "refund_id_28430289843",
            payment_id: "payment_id_742365728345"
        };

        Aggregator.prototype.createRefund = jest.fn().mockResolvedValue(refundResponse);

        const response = await aggregatorProcessor.createRefund(requestPayload);

        expect(response).toHaveProperty('gid');
        expect(response).toHaveProperty('aggregator_payment_refund_details');
    })

    test('getRefundDetails', async () => {
        Aggregator.prototype.getRefundDetails = jest.fn().mockResolvedValue({
            amount: 100,
            currency: "INR",
            status: "pending",
            payment_id: "pay_1234",
            refund_utr: "refund_293284"
        });

        const response = await aggregatorProcessor.getRefundDetails({gid: "TR8273429127187"});
        console.log(response)
        expect(response).toHaveProperty('gid');
        expect(response).toHaveProperty('aggregator_payment_refund_details');
    })

    test('processRefundWebhook', async () => {
        const webhookPayload = {
            headers: {
                checksum: "X0324893URITEH029843"
            },
            data: {
                "amount": 33.0,
                "transactionReferenceId": "TR67160B990EA2149E59-17294985400131760447",
                "transaction_id": "pay_20894ruflor20",
                "status": "REFUND_COMPLETE",
                "refund_utr": "ICICI0298342435"
            }
        }
        Aggregator.prototype.processRefundWebhook = jest.fn().mockResolvedValue({
            amount: 100,
            currency: "INR",
            status: "pending",
            payment_id: "pay_1234",
            refund_utr: "ICICI0298342435"
        });

        const response = await aggregatorProcessor.processRefundWebhook(webhookPayload);
    })
})

