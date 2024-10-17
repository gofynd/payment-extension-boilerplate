const AggregatorProcessor = require("../services/processor");
const asyncHandler = require("express-async-handler");

//@desc create order aggregator
//@route POST /api/v1/payment_session/:gid
//@access public
exports.createOrderHandler = asyncHandler(async (req, res, next) => {
    let request_payload = req.body;
    const instance = new AggregatorProcessor();
    const response = await instance.createOrder(request_payload);
    res.status(httpStatus.CREATED).json(response);
});

//@desc get payment details
//@route GET /api/v1/payment_session/:gid
//@access public
exports.getPaymentDetailsHandler = asyncHandler(async (req, res, next) => {
    let request_payload = {
        ...req.params,
        ...req.query,
        ...req.body
    };
    request_payload['headers'] = { ...req.headers }
    const instance = new AggregatorProcessor();
    const response = await instance.getPaymentDetails(request_payload);
    return res.status(httpStatus.OK).json(response);
});


//@desc get refund details
//@route GET /api/v1/payment_session/:gid/refund
//@access public
exports.getRefundDetailsHandler = asyncHandler(async (req, res, next) => {
    let request_payload = {
        ...req.params,
        ...req.query,
        ...req.body
    };
    request_payload['headers'] = { ...req.headers }
    const instance = new AggregatorProcessor();
    const response = await instance.getRefundDetails(request_payload);
    return res.status(httpStatus.OK).json(response);
});

//@desc payment completion callback
//@route GET /api/v1/payment_callback/:gid
//@access public
exports.paymentCallbackHandler = asyncHandler(async (req, res, next) => {
    req.body.responseData = JSON.parse(req.body.responseData);
    let request_payload = {
        ...req.params,
        ...req.query,
        ...req.body
    };
    request_payload['headers'] = { ...req.headers }
    const instance = new AggregatorProcessor();
    const response = await instance.processCallback(request_payload);
    return res.status(httpStatus.REDIRECT).render(ActionType.REDIRECT, response);
});

//@desc create refund aggregator
//@route POST /api/v1/payment_session/:gid/refund
//@access public
exports.refundHandler = asyncHandler(async (req, res, next) => {
    let request_payload = {
        ...req.body
    };
    const instance = new AggregatorProcessor();
    const response = await instance.processRefund(request_payload);
    return res.status(httpStatus.ACCEPTED).json(response);
});

//@desc payment status update webhook
//@route POST /api/v1/webhook/payment
//@access public
exports.processWebhook = asyncHandler(async (req, res, next) => {
    let requestPayload = {
        data: req.body,
        headers: req.headers
    };

    const instance = new AggregatorProcessor();
    await instance.processWebhook(requestPayload)
    return res.status(httpStatus.OK).json({
        success: true,
    });
});

// can be merged with above webhook?
//@desc refund status webhook
//@route POST /api/v1/webhook/refund
//@access public
exports.processRefundWebhook = asyncHandler(async (req, res, next) => {
    const webhook_payload = {
        headers: req.headers,
        data: req.body
    }
    const instance = new AggregatorProcessor();
    await instance.processRefundWebhook(webhook_payload)
    return res.status(httpStatus.OK).json({
        success: true,
    });
});
