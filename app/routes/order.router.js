const express = require('express');
const {
  verifyPlatformChecksum,
  verifyStatusChecksum,
} = require('../middleware/verifyChecksum');
const {
  createOrderHandler,
  getPaymentDetailsHandler,
  paymentCallbackHandler,
  createRefundHandler,
  getRefundDetailsHandler,
  processWebhook,
  processRefundWebhook,
} = require('../controllers/orderController');

const orderRouter = express.Router();

/**
 * @route POST /payment_session/:gid
 * @desc Create a new payment session
 * @access Public (requires platform checksum verification)
 * @CalledFrom - Fynd core
 */
orderRouter.post(
  '/payment_session/:gid',
  verifyPlatformChecksum,
  createOrderHandler
);

/**
 * @route GET /payment_session/:gid
 * @desc Get details of a payment session
 * @access Public (requires status checksum verification)
 * @CalledFrom - Fynd core
 */
orderRouter.get(
  '/payment_session/:gid',
  verifyStatusChecksum,
  getPaymentDetailsHandler
);

/**
 * @route POST /payment_session/:gid/refund
 * @desc Create a refund for a payment session
 * @access Public (requires platform checksum verification)
 * @CalledFrom - Fynd core
 */
orderRouter.post(
  '/payment_session/:gid/refund',
  verifyPlatformChecksum,
  createRefundHandler
);

/**
 * @route GET /payment_session/:gid/refund
 * @desc Get details of a refund for a payment session
 * @access Public (requires status checksum verification)
 * @CalledFrom - Fynd core
 */
orderRouter.get(
  '/payment_session/:gid/refund',
  verifyStatusChecksum,
  getRefundDetailsHandler
);

/**
 * @route POST /payment_callback/:company_id/:app_id
 * @desc Handle payment completion callback
 * @access Public
 */
orderRouter.post(
  '/payment_callback/:company_id/:app_id',
  paymentCallbackHandler
);

/**
 * @route POST /webhook/payment/:company_id/:app_id
 * @desc Handle payment status update webhook
 * @access Public
 * @CalledFrom - Payment AGG
 */
orderRouter.post('/webhook/payment/:company_id/:app_id', processWebhook);

/**
 * @route POST /webhook/refund/:company_id/:app_id
 * @desc Handle refund status update webhook
 * @access Public
 * @CalledFrom - Payment AGG
 */
orderRouter.post('/webhook/refund/:company_id/:app_id', processRefundWebhook);

module.exports = orderRouter;
