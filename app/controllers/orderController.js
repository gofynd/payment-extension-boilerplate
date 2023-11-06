'use strict';


const AggregatorProcessor = require("../services/processor");
const asyncHandler = require("express-async-handler");
const { httpStatus, ActionType } = require("../../constants");
const logger = require("../common/logger");

//@desc create order aggregator
//@route POST /api/v1/payment_session/:gid
//@access public
exports.createOrderHandler = asyncHandler(async (req, res, next) => {
    let request_payload = req.body;
    const instance = new AggregatorProcessor();
    const response = await instance.createOrder(request_payload);
    res.status(httpStatus.CREATED).json(response);
});

//@desc create order aggregator
//@route GET /api/v1/pgloader/:_id
//@access public
exports.renderPGHandler = asyncHandler(async (req, res, next) => {
    let request_payload = req.params
    const instance = new AggregatorProcessor();
    const response = await instance.renderPG(request_payload)
    

    if (response.action == ActionType.HTMLSTRING){
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(response.htmlString);
    }
    else {
        console.log(response)
        res.status(httpStatus.TEMP_REDIRECT).render(response.action, response);
    }
})

//@desc get payment details
//@route GET /api/v1/payment_session/:gid
//@access public
exports.getPaymentDetailsHandler = asyncHandler(async (req, res, next) => {
    let request_payload = {
        ...req.params,
        ...req.query,
        ...req.body
    };
    request_payload['headers'] = {...req.headers}
    const instance = new AggregatorProcessor();
    const response = await instance.getPaymentDetails(request_payload);
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
    request_payload['headers'] = {...req.headers}
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

//@desc refund status webhook
//@route POST /api/v1/webhook/refund
//@access public
exports.processRefundWebhook = asyncHandler(async (req, res, next) => {
    const webhook_payload = req.body;
    webhook_payload["checksum"] = req.headers["checksum"];
    const instance = new AggregatorProcessor();
    await instance.processRefundWebhook(webhook_payload)
    return res.status(httpStatus.OK).json({
        success: true,
    });
});

// can be merged with above webhook?
//@desc refund status webhook
//@route POST /api/v1/webhook/refund
//@access public
exports.processPaymentUpdateStatus = asyncHandler(async (req, res, next) => {
    let requestPayload = {
        data: req.body,
        headers: req.headers
    };
    const instance = new AggregatorProcessor();
    const response = await instance.processPaymentUpdateStatus(requestPayload)
    return res.status(httpStatus.OK).json(response);
});


exports.processPaymentCancelHandler = asyncHandler(async (req, res, next) => {
    let requestPayload = {
        ...req.params,
        ...req.query,
        ...req.body
    };
    requestPayload['headers'] = {...req.headers}
    const instance = new AggregatorProcessor();
    const response = await instance.processPaymentCancel(requestPayload);
    logger.info('Cancel Handler Response: %O', JSON.stringify(response));
    return res.status(httpStatus.OK).redirect(response.cancelUrl);
});

//@desc: shipment update 
//@route POST /api/v1/payment/shipment
//@access public
exports.processShipmentUpdate = asyncHandler(async (req, res, next) => {
    const requestPayload = req.body;
    const instance = new AggregatorProcessor();
    const response = await instance.processShipmentUpdate(requestPayload);
    return res.status(httpStatus.OK).json(response)
});

//@desc: customer validation
//@route POST /api/v1/customer/validation
//@access public
exports.validateCustomer = asyncHandler(async (req, res, next) => {
    const requestPayload = req.body;
    const instance = new AggregatorProcessor();
    const response = await instance.validateCustomer(requestPayload)
    return res.status(httpStatus.OK).json(response)
})