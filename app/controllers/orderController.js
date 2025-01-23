const asyncHandler = require('express-async-handler');
const AggregatorProcessor = require('../services/processor');

/**
 * @desc Create a new payment order
 * @route POST /api/v1/payment_session/:gid
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} req.body - Payload containing order details
 * @param {Object} res - Express response object
 */
exports.createOrderHandler = asyncHandler(async (req, res) => {
  const requestPayload = req.body;
  const processor = new AggregatorProcessor();
  const response = await processor.createOrder(requestPayload);
  res.status(200).json(response);
});

/**
 * @desc Create a refund for a payment session
 * @route POST /api/v1/payment_session/:gid/refund
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} req.body - Payload containing refund details
 * @param {Object} res - Express response object
 */
exports.createRefundHandler = asyncHandler(async (req, res) => {
  const requestPayload = req.body;
  const processor = new AggregatorProcessor();
  const response = await processor.createRefund(requestPayload);
  return res.status(200).json(response);
});

/**
 * @desc Get details of a payment session
 * @route GET /api/v1/payment_session/:gid
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} req.params - Parameters from the URL
 * @param {Object} req.query - Query parameters
 * @param {Object} res - Express response object
 */
exports.getPaymentDetailsHandler = asyncHandler(async (req, res) => {
  const params = { ...req.params, ...req.query };
  const processor = new AggregatorProcessor();
  const response = await processor.getPaymentDetails(params);
  return res.status(200).json(response);
});

/**
 * @desc Get details of a refund for a payment session
 * @route GET /api/v1/payment_session/:gid/refund
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} req.params - Parameters from the URL
 * @param {Object} req.query - Query parameters
 * @param {Object} res - Express response object
 */
exports.getRefundDetailsHandler = asyncHandler(async (req, res) => {
  const params = { ...req.params, ...req.query };
  const processor = new AggregatorProcessor();
  const response = await processor.getRefundDetails(params);
  return res.status(200).json(response);
});

/**
 * @desc Handle payment completion callback
 * @route POST /api/v1/payment_callback/:company_id/:app_id
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} req.params - Parameters from the URL
 * @param {Object} req.body - Payload containing callback details
 * @param {Object} res - Express response object
 */
exports.paymentCallbackHandler = asyncHandler(async (req, res) => {
  const requestPayload = {
    ...req.params,
    ...req.query,
    ...req.body,
  };
  const processor = new AggregatorProcessor();
  const response = await processor.processCallback(requestPayload);
  return res.status(308).render('redirector', response);
});

/**
 * @desc Process payment status update webhook
 * @route POST /api/v1/webhook/payment
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} req.body - Webhook payload
 * @param {Object} req.headers - HTTP headers
 * @param {Object} res - Express response object
 */
exports.processWebhook = asyncHandler(async (req, res) => {
  const webhookPayload = {
    data: {
      ...req.body,
      ...req.params,
    },
    headers: req.headers,
  };

  const processor = new AggregatorProcessor();
  await processor.processWebhook(webhookPayload);
  return res.status(200).json({
    success: true,
  });
});

/**
 * @desc Process refund status update webhook
 * @route POST /api/v1/webhook/refund
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} req.body - Webhook payload
 * @param {Object} req.headers - HTTP headers
 * @param {Object} res - Express response object
 */
exports.processRefundWebhook = asyncHandler(async (req, res) => {
  const webhookPayload = {
    data: {
      ...req.body,
      ...req.params,
    },
    headers: req.headers,
  };

  const processor = new AggregatorProcessor();
  await processor.processRefundWebhook(webhookPayload);
  return res.status(200).json({
    success: true,
  });
});
