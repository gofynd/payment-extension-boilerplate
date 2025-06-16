const { fdkExtension } = require('../fdk');
const { getHmacChecksum } = require('../utils/signatureUtils');
const PaymentModel = require('../models/payment.model');

// Environment variables
const EXTENSION_API_SECRET = process.env.EXTENSION_API_SECRET;

// Payment status constants
const paymentStatus = {
  COMPLETE: 'complete',
  PENDING: 'pending',
  FAILED: 'failed'
};

// Refund status constants
const refundStatus = {
  INITIATED: 'initiated',
  COMPLETE: 'complete',
  FAILED: 'failed'
};

// Payment mode constant
const PAYMENT_MODE = 'live'; // Can be 'live' or 'test'

exports.paymentCallbackHandler = async (req, res, next) => {
  try {
    const { company_id, app_id } = req.params;
    console.log('LOG: Query parameters:', req.query);
    const { gid } = req.query;
    const callbackPayload = {
      ...req.body,
      company_id,
      app_id
    };

    console.log('LOG: Payload for process callback', callbackPayload);

    // Get stored payment payload from PaymentModel
    const storedPayment = await PaymentModel.getPayment(gid);
    if (!storedPayment) {
      throw new Error('Payment session not found');
    }

    let status = null;
    let paymentId = null;

    // Verify callback signature
    const isChecksumValid = true; // In real implementation, verify checksum

    if (!isChecksumValid) {
      console.log('Request Unauthorised, checksum mismatch');
      status = paymentStatus.FAILED;
    } else if (callbackPayload.status === 'PAYMENT_COMPLETE') {
      status = paymentStatus.COMPLETE;
      paymentId = callbackPayload.transaction_id;
    } else {
      status = paymentStatus.FAILED;
      paymentId = callbackPayload.transaction_id;
    }

    const payload = {
      gid,
      order_details: {
        gid,
        amount: storedPayment.amount,
        status: status ? String(status) : null,
        currency: storedPayment.currency,
        aggregator_order_details: storedPayment,
        aggregator: 'Dummy',
      },
      status: status ? String(status) : null,
      currency: storedPayment.currency,
      total_amount: storedPayment.amount,
      payment_details: [
        {
          gid,
          amount: storedPayment.amount,
          currency: storedPayment.currency,
          payment_id: paymentId ? String(paymentId) : null,
          mode: PAYMENT_MODE,
          success_url: storedPayment.success_url,
          cancel_url: storedPayment.cancel_url,
          amount_captured: storedPayment.amount,
          payment_methods: storedPayment.payment_methods,
          g_user_id: storedPayment.g_user_id,
          aggregator_order_id: paymentId ? String(paymentId) : null,
          status: status ? String(status) : null,
          created: String(Date.now()),
        },
      ],
    };

    const checksum = getHmacChecksum(JSON.stringify(payload), EXTENSION_API_SECRET);
    const payloadWithChecksum = {
      ...payload,
      checksum,
    };

    const platformClient = await fdkExtension.getPlatformClient(company_id);
    const applicationClient = platformClient.application(app_id);
    await applicationClient.payment.updatePaymentSession({
      gid,
      body: payloadWithChecksum,
    });

    // Get success/cancel URLs from stored payment
    const redirectUrl = status === paymentStatus.COMPLETE ? storedPayment.success_url : storedPayment.cancel_url;

    const responseData = {
      action: 'redirect',
      redirectUrl: encodeURIComponent(redirectUrl),
    };
    console.log('LOG:Callback response', responseData);
    
    return res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

exports.processPaymentWebhookHandler = async (req, res, next) => {
  try {
    const webhookPayload = req.body;
    console.log('LOG: Webhook request body', webhookPayload);
    
    const { data } = webhookPayload;
    if (!data || !data.transactionReferenceId) {
      throw new Error('Transaction reference ID is required');
    }
    const gid = data.transactionReferenceId;

    // Get stored payment payload from SQLite
    const storedPayment = await PaymentModel.getPayment(gid);
    if (!storedPayment) {
      throw new Error('Payment session not found');
    }

    const { amount } = data;
    const currency = storedPayment.currency || 'INR';
    let status = null;
    let paymentId = null;

    // Verify webhook signature
    const isWebhookChecksumValid = true; // In real implementation, verify checksum

    if (!isWebhookChecksumValid) {
      console.log('Request Unauthorised, checksum mismatch');
      status = paymentStatus.FAILED;
    } else if (data.status === 'PAYMENT_PENDING') {
      status = paymentStatus.PENDING;
    } else if (data.status === 'PAYMENT_COMPLETE') {
      status = paymentStatus.COMPLETE;
      paymentId = data.transaction_id;
    } else {
      status = paymentStatus.FAILED;
    }

    const amountInPaise = amount * 100;
    const payload = {
      gid,
      order_details: {
        gid,
        amount: amountInPaise,
        status,
        currency,
        aggregator_order_details: data,
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
          mode: PAYMENT_MODE,
          success_url: storedPayment.success_url || '',
          cancel_url: storedPayment.cancel_url || '',
          amount_captured: amountInPaise,
          payment_methods: storedPayment.payment_methods || [{}],
          g_user_id: storedPayment.g_user_id || '<User id if exists>',
          aggregator_order_id: paymentId,
          status,
          created: String(Date.now()),
        },
      ],
    };

    const checksum = getHmacChecksum(JSON.stringify(payload), EXTENSION_API_SECRET);
    const payloadWithChecksum = {
      ...payload,
      checksum,
    };

    const platformClient = await fdkExtension.getPlatformClient(data.company_id);
    const applicationClient = platformClient.application(data.app_id);
    await applicationClient.payment.updatePaymentSession({
      gid,
      body: payloadWithChecksum,
    });

    console.log('LOG: Webhook complete');
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.processRefundWebhookHandler = async (req, res, next) => {
  try {
    const webhookPayload = req.body;
    console.log('LOG: Request body for Refund Webhook', webhookPayload);

    const { data } = webhookPayload;
    const orderIdCombined = data.transactionReferenceId;
    const gid = orderIdCombined.split('-')[0];
    const requestId = orderIdCombined.split('-')[1];

    const { amount } = data;
    const currency = 'INR';
    let status = null;
    let paymentId = null;
    let refundUtr = null;

    // Verify webhook signature
    const isRefundWebhookChecksumValid = true; // In real implementation, verify checksum

    if (!isRefundWebhookChecksumValid) {
      console.log('Request Unauthorised, checksum mismatch');
      status = refundStatus.FAILED;
    } else if (data.status === 'REFUND_PENDING') {
      status = refundStatus.PENDING;
    } else if (data.status === 'REFUND_COMPLETE') {
      status = refundStatus.COMPLETE;
      paymentId = data.transaction_id;
      refundUtr = data.refund_utr;
    } else {
      status = refundStatus.FAILED;
    }

    const amountInPaise = amount * 100;
    const payload = {
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
        mode: PAYMENT_MODE,
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
      meta: data,
    };

    const checksum = getHmacChecksum(JSON.stringify(payload), EXTENSION_API_SECRET);
    const payloadWithChecksum = {
      ...payload,
      checksum,
    };

    const platformClient = await fdkExtension.getPlatformClient(data.company_id);
    const applicationClient = platformClient.application(data.app_id);
    await applicationClient.payment.updateRefundSession({
      gid,
      requestId,
      body: payloadWithChecksum,
    });

    console.log('LOG: Webhook processed');
    res.status(200).json({
      success: true,
      message: 'Refund webhook processed successfully'
    });
  } catch (error) {
    next(error);
  }
}; 