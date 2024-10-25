const Aggregator = require('./aggregators/aggregator');
const { fdkExtension } = require('../fdk');
const config = require('../config');
const { getHmacChecksum } = require('../utils/signatureUtils');
const { Order } = require('../models/model');

class AggregatorProcessor {
  async createOrder(requestPayload) {
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

    console.log('Payload received from platform', requestPayload);
    const { gid } = requestPayload;

    const aggregator = new Aggregator(
      requestPayload.app_id,
      requestPayload.company_id
    );
    const redirectUrl = await aggregator.createOrder(requestPayload);

    await Order.create({
      app_id: requestPayload.app_id,
      company_id: requestPayload.company_id,
      gid,
      success_url: requestPayload.success_url,
      cancel_url: requestPayload.cancel_url,
    });

    const responseData = {
      success: true,
      redirect_url: redirectUrl,
      gid,
    };
    console.log('Response for create payment', responseData);
    return responseData;
  }

  async processCallback(requestPayload) {
    console.log('Payload for process callback', requestPayload);

    const gid = await Aggregator.getOrderFromCallback(requestPayload);

    const aggregator = new Aggregator(
      requestPayload.app_id,
      requestPayload.company_id
    );
    const callbackResponse = await aggregator.processCallback(requestPayload);

    const { amount, currency, status, paymentId } = callbackResponse;
    const payload = this.createPaymentUpdatePayload(
      gid,
      amount,
      currency,
      status,
      paymentId,
      requestPayload
    );
    await this.updatePlatformPaymentStatus(
      requestPayload.app_id,
      requestPayload.company_id,
      gid,
      payload
    );

    const order = await Order.findOne({
      app_id: requestPayload.app_id,
      company_id: requestPayload.company_id,
      gid,
    });
    const redirectUrl =
      status === 'complete' ? order.success_url : order.cancel_url;

    const responseData = {
      action: 'redirect',
      redirectUrl: encodeURIComponent(redirectUrl),
    };
    console.log('Callback response', responseData);
    return responseData;
  }

  async processWebhook(webhookPayload) {
    console.log('Webhook request body', webhookPayload);
    const { data } = webhookPayload;
    const gid = await Aggregator.getOrderFromWebhook(data);

    const aggregator = new Aggregator({
      app_id: data.app_id,
      company_id: data.company_id,
    });
    const webhookResponse = await aggregator.processWebhook(webhookPayload);

    const { amount, currency, status, paymentId } = webhookResponse;
    const payload = this.createPaymentUpdatePayload(
      gid,
      amount,
      currency,
      status,
      paymentId,
      webhookPayload.data
    );
    await this.updatePlatformPaymentStatus(
      data.app_id,
      data.company_id,
      gid,
      payload
    );

    console.log('Webhook complete');
  }

  async getPaymentDetails(data) {
    console.log('Request for get payment details', data);

    const aggregator = new Aggregator();
    const aggResponse = await aggregator.getOrderDetails(data.gid);
    const { amount, currency, status, paymentId } = aggResponse;

    const responseData = this.createPaymentUpdatePayload(
      data.gid,
      amount,
      currency,
      status,
      paymentId,
      aggResponse
    );
    console.log('Response for get Payment Details', responseData);
    return responseData;
  }

  createPaymentUpdatePayload(
    gid,
    amount,
    currency,
    status,
    paymentId,
    aggregatorResponse
  ) {
    const amountInPaise = amount * 100; // Convert to paise/cents before sending to platform
    return {
      gid,
      order_details: {
        gid,
        amount: amountInPaise,
        status,
        currency,
        aggregator_order_details: aggregatorResponse,
        aggregator: 'Dummy',
      },
      status,
      currency,
      total_amount: amountInPaise,
      payment_details: [
        {
          gid,
          amount: amountInPaise,
          currency,
          payment_id: paymentId,
          mode: config.env,
          success_url: '',
          cancel_url: '',
          amount_captured: amountInPaise,
          payment_methods: [{}],
          g_user_id: '<User id if exists>',
          aggregator_order_id: paymentId,
          status,
          created: String(Date.now()),
        },
      ],
    };
  }

  async updatePlatformPaymentStatus(appId, companyId, gid, payload) {
    const checksum = getHmacChecksum(
      JSON.stringify(payload),
      config.api_secret
    );
    const payloadWithChecksum = {
      ...payload,
      checksum,
    };

    const platformClient = await fdkExtension.getPlatformClient(companyId);
    const applicationClient = platformClient.application(appId);
    const sdkResponse = await applicationClient.payment.updatePaymentSession({
      gid,
      body: payloadWithChecksum,
    });
    return sdkResponse;
  }

  async createRefund(requestPayload) {
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

    console.log('Request body for create refund', requestPayload);

    const aggregator = new Aggregator();
    const refundResponse = await aggregator.createRefund(requestPayload);

    const { amount, currency, requestId, gid } = requestPayload;
    const { status, refundUtr, paymentId } = refundResponse;
    const responseData = {
      gid,
      aggregator_payment_refund_details: {
        status,
        amount,
        currency,
        requestId,
        refundUtr,
        paymentId,
      },
    };
    console.log('Response for create refund', responseData);
    return responseData;
  }

  async getRefundDetails(data) {
    console.log('Request for get refund details', data);

    const aggregator = new Aggregator();
    const aggResponse = await aggregator.getRefundDetails(data.gid);
    const { amount, currency, status } = aggResponse;

    const responseData = {
      aggregator_payment_refund_details: [
        {
          amount,
          currency,
          request_id: data.refund_id,
          status,
        },
      ],
      gid: data.gid,
    };
    console.log('Response for get refund Details', responseData);
    return responseData;
  }

  async processRefundWebhook(webhookPayload) {
    console.log('Request body for Refund Webhook', webhookPayload);

    const { data } = webhookPayload;
    const { gid, requestId } = await Aggregator.getOrderFromRefundWebhook(data);

    const aggregator = new Aggregator({
      app_id: data.app_id,
      company_id: data.company_id,
    });
    const webhookResponse =
      await aggregator.processRefundWebhook(webhookPayload);

    const { amount, currency, status, paymentId, refundUtr } = webhookResponse;
    const payload = this.createRefundUpdatePayload(
      gid,
      requestId,
      amount,
      currency,
      status,
      paymentId,
      refundUtr,
      webhookPayload.data
    );
    await this.updatePlatformRefundStatus(
      data.app_id,
      data.company_id,
      gid,
      requestId,
      payload
    );

    console.log('Webhook processed');
  }

  createRefundUpdatePayload(
    gid,
    requestId,
    amount,
    currency,
    status,
    paymentId,
    refundUtr,
    aggregatorPayload
  ) {
    const amountInPaise = amount * 100;
    return {
      gid,
      status,
      currency,
      total_amount: amountInPaise,
      refund_details: [
        {
          status,
          request_id: requestId,
          payment_id: paymentId,
          refund_utr: refundUtr,
          amount: amountInPaise,
          currency,
          created: String(Date.now()),
        },
      ],
      payment_details: {
        gid,
        status,
        aggregator_order_id: paymentId,
        payment_id: paymentId,
        mode: config.env,
        amount: amountInPaise,
        success_url: '',
        cancel_url: '',
        amount_captured: amountInPaise,
        payment_methods: [{}],
        g_user_id: '<User id if exists>',
        currency,
        amount_refunded: amountInPaise,
        created: String(Date.now()),
      },
      meta: aggregatorPayload,
    };
  }

  async updatePlatformRefundStatus(appId, companyId, gid, requestId, payload) {
    const checksum = getHmacChecksum(
      JSON.stringify(payload),
      config.api_secret
    );
    const payloadWithChecksum = {
      ...payload,
      checksum,
    };

    const platformClient = await fdkExtension.getPlatformClient(companyId);
    const applicationClient = platformClient.application(appId);
    const sdkResponse = await applicationClient.payment.updateRefundSession({
      gid,
      requestId,
      body: payloadWithChecksum,
    });
    return sdkResponse;
  }
}

module.exports = AggregatorProcessor;
