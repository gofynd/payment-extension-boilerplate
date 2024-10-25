const asyncHandler = require('express-async-handler');
const AggregatorProcessor = require('../services/processor');

// @desc create order
// @route POST /api/v1/payment_session/:gid
// @access public
exports.createOrderHandler = asyncHandler(async (req, res) => {
  const requestPayload = req.body;
  const processor = new AggregatorProcessor();
  const response = await processor.createOrder(requestPayload);
  res.status(200).json(response);
});

// @desc create refund
// @route POST /api/v1/payment_session/:gid/refund
// @access public
exports.createRefundHandler = asyncHandler(async (req, res) => {
  const requestPayload = req.body;
  const processor = new AggregatorProcessor();
  const response = await processor.createRefund(requestPayload);
  return res.status(200).json(response);
});

// @desc get payment details
// @route GET /api/v1/payment_session/:gid
// @access public
exports.getPaymentDetailsHandler = asyncHandler(async (req, res) => {
  const params = { ...req.params, ...req.query };
  const processor = new AggregatorProcessor();
  const response = await processor.getPaymentDetails(params);
  return res.status(200).json(response);
});

// @desc get refund details
// @route GET /api/v1/payment_session/:gid/refund
// @access public
exports.getRefundDetailsHandler = asyncHandler(async (req, res) => {
  const params = { ...req.params, ...req.query };
  const processor = new AggregatorProcessor();
  const response = await processor.getRefundDetails(params);
  return res.status(200).json(response);
});

// @desc payment completion callback
// @route GET /api/v1/payment_callback/:gid
// @access public
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

// @desc payment status update webhook
// @route POST /api/v1/webhook/payment
// @access public
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

// @desc refund status webhook
// @route POST /api/v1/webhook/refund
// @access public
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
