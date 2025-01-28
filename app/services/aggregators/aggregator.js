const axios = require('axios');
const config = require('../../config');
const { BadRequestError } = require('../../utils/errorUtils');
const { aggregatorConfig, paymentStatus, refundStatus } = require('./config');

class Aggregator {
  constructor(appId, companyId) {
    this.appId = appId;
    this.companyId = companyId;
  }

  static async getOrderFromCallback(callbackPayload) {
    const gid = callbackPayload.transactionReferenceId;
    return gid;
  }

  static async getOrderFromWebhook(webhookPayload) {
    const gid = webhookPayload.transactionReferenceId;
    return gid;
  }

  static async getOrderFromRefundWebhook(webhookPayload) {
    // Splitting both here from transaction id
    const orderIdCombined = webhookPayload.transactionReferenceId;
    const gid = orderIdCombined.split('-')[0];
    const requestId = orderIdCombined.split('-')[1];
    return { gid, requestId };
  }

  async createOrder(payload) {
    /*
        Returns: redirect_url for payment page
        */

    const customerData = {
      customer_name: payload.customer_name,
      customer_contact: payload.customer_contact,
      customer_email: payload.customer_email,
    };
    const callbackUrl = `${config.base_url}api/v1/callback/${this.companyId}/${this.appId}`;

    const body = {
      // Create payment gateway specific body here
      amount: payload.amount,
      currency: payload.currency,
      transactionReferenceId: payload.gid,
      customer: customerData,
      callbackUrl,
      address: payload.billing_address,
    };

    const url = config.pgBaseUrl + aggregatorConfig.createOrder;

    const headers = {
      ContentType: 'application/json',
    };

    console.log('LOG: for create order payload to PG AGG: -', body);

    /**
     * Use make request to hit API call for PG
     */
    // const response = await axios.post({
    //   method: 'POST',
    //   url,
    //   data: body,
    //   headers,
    // });

    // Demo response from payment gateway
    const response = {
      status: 200,
      data: {
        payment_url:
          'https://api.razorpay.com/accept-payment/pay_id_1234567890/',
      },
    };

    if (response.status === 200) {
      return response.data.payment_url;
    }
    throw new BadRequestError('Bad request');
  }

  async createRefund(requestPayload) {
    const {
      aggregator_payment_id: forwardPaymentId,
      gid,
      requestId,
      amount,
      currency,
    } = requestPayload;

    const orderIdCombined = `${gid}-${requestId}`;
    // Prepare payload for refund
    const payload = {
      amount: {
        value: amount / 100,
        currency_code: currency,
      },
      invoice_id: orderIdCombined,
    };

    // Generate refund URL
    const url = `${config.pgBaseUrl}/v2/payments/captures/${
      forwardPaymentId
    }/refund`;

    const response = await axios.post({
      method: 'POST',
      url,
      data: payload,
    });
    // Demo refund initiate response
    // const response = {
    //     success: true,
    //     refund_utr: "ICIC2098423058020",
    //     refund_id: "890342354509842",
    // }

    if (response.status === 200) {
      return {
        status: refundStatus.INITIATED,
        refundUtr: response.data.refund_utr,
        paymentId: response.data.refund_id,
      };
    }

    return {
      status: refundStatus.FAILED,
    };
  }

  async processCallback(callbackPayload) {
    /*
        Customize function as per callback payload
        */

    const { amount } = callbackPayload;
    const currency = 'INR';
    let status = null;
    let paymentId = null;

    // Verify Callback
    const checksum = await this.verifyChecksum(callbackPayload);

    if (!checksum) {
      // checksum verification failed
      console.log('Request Unauthorised, checksum mismatch');
      status = paymentStatus.FAILED;
      return {
        amount,
        currency,
        status,
      };
    }
    if (callbackPayload.status === 'PAYMENT_COMPLETE') {
      status = paymentStatus.COMPLETE;
      paymentId = callbackPayload.transaction_id;
    }

    console.log('Callback return value', { amount, currency, status });
    return {
      amount,
      currency,
      status,
      paymentId,
    };
  }

  // eslint-disable-next-line no-unused-vars
  async verifyChecksum(payload) {
    // Add logic to verify callback and webhook
    return true;
  }

  async processWebhook(webhookPayload) {
    /*
        Customize function as per webhook payload
        */

    const { amount } = webhookPayload.data;
    const currency = 'INR';
    let status = null;
    let paymentId = null;

    // Verify webhook
    const checksum = await this.verifyChecksum(webhookPayload);

    if (!checksum) {
      // checksum verification failed
      console.log('Request Unauthorised, checksum mismatch');
      status = paymentStatus.FAILED;
      return {
        amount,
        currency,
        status,
      };
    }
    if (webhookPayload.data.status === 'PAYMENT_PENDING') {
      status = paymentStatus.PENDING;
    } else if (webhookPayload.data.status === 'PAYMENT_COMPLETE') {
      status = paymentStatus.COMPLETE;
      paymentId = webhookPayload.data.transaction_id;
    } else {
      status = paymentStatus.FAILED;
    }

    console.log('Webhook return value', { amount, currency, status });
    return {
      amount,
      currency,
      status,
      paymentId,
    };
  }

  async getOrderDetails(gid) {
    let amount;
    const currency = 'INR';
    let status = null;
    let paymentId = null;

    const url = `${config.pgBaseUrl + aggregatorConfig.orderStatus}/${gid}`;

    const headers = {
      ContentType: 'application/json',
    };

    const response = await axios.get({
      method: 'GET',
      url,
      headers,
    });
    // Demo response from payment gateway
    // const response = {
    //     status: 200,
    //     payment_status: "PAYMENT_COMPLETE",
    //     currency: "INR",
    //     amount: "100.00",
    //     transaction_id: "20230404011640000850068625351118848",
    // }

    if (response.status === 200) {
      if (response.data.payment_status === 'PAYMENT_COMPLETE') {
        status = paymentStatus.COMPLETE;
        paymentId = response.data.transaction_id;
        amount = response.data.amount;
      } else if (response.data.payment_status === 'PAYMENT_PENDING') {
        status = paymentStatus.PENDING;
        paymentId = response.data.transaction_id;
        amount = response.data.amount;
      } else {
        status = paymentStatus.FAILED;
      }
    }

    console.log('Status return value', { amount, currency, status });
    return {
      amount,
      currency,
      status,
      paymentId,
    };
  }

  async processRefundWebhook(webhookPayload) {
    /*
        Customize function as per webhook payload
        */

    const { amount } = webhookPayload.data;
    const currency = 'INR';
    let status = null;
    let paymentId = null;
    let refundUtr = null;

    // Verify webhook
    const checksum = await this.verifyChecksum(webhookPayload);

    if (!checksum) {
      // checksum verification failed
      console.log('Request Unauthorised, checksum mismatch');
      status = refundStatus.FAILED;
      return {
        amount,
        currency,
        status,
      };
    }
    if (webhookPayload.data.status === 'REFUND_PENDING') {
      status = refundStatus.PENDING;
    } else if (webhookPayload.data.status === 'REFUND_COMPLETE') {
      status = refundStatus.COMPLETE;
      paymentId = webhookPayload.data.transaction_id;
      refundUtr = webhookPayload.data.refund_utr;
    } else {
      status = refundStatus.FAILED;
    }

    console.log('Webhook return value', { amount, currency, status });
    return {
      amount,
      currency,
      status,
      paymentId,
      refundUtr,
    };
  }

  async getRefundDetails(gid) {
    let amount;
    const currency = 'INR';
    let status = null;
    let paymentId = null;
    let refundUtr = null;

    const url = `${config.pgBaseUrl + aggregatorConfig.refundStatus}/${gid}`;

    const headers = {
      ContentType: 'application/json',
    };

    const response = await axios.get({
      method: 'GET',
      url,
      headers,
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

    if (response.status === 200) {
      if (response.data.refund_status === 'REFUND_COMPLETE') {
        status = refundStatus.COMPLETE;
        paymentId = response.data.transaction_id;
        amount = response.data.amount;
        refundUtr = response.data.refund_utr;
      } else if (response.data.refund_status === 'REFUND_PENDING') {
        status = refundStatus.PENDING;
        paymentId = response.data.transaction_id;
        amount = response.data.amount;
      } else {
        status = refundStatus.FAILED;
      }
    }

    console.log('Status return value', { amount, currency, status });
    return {
      amount,
      currency,
      status,
      paymentId,
      refundUtr,
    };
  }
}

module.exports = Aggregator;
