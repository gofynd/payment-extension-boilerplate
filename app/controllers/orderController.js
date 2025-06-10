'use strict';

const AggregatorProcessor = require("../services/processor");
const { httpStatus, ActionType } = require("../../constants");
const logger = require("../common/logger");

//@desc create order aggregator
//@route POST /api/v1/payment_session/:gid
//@access public
exports.createOrderHandler = async (req, res, next) => {
    try {
        let request_payload = req.body;
        const instance = new AggregatorProcessor();
        const response = await instance.createOrder(request_payload);
        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
};

//@desc create order aggregator
//@route GET /api/v1/pgloader/:_id
//@access public
exports.renderPGHandler = async (req, res, next) => {
    try {
        let request_payload = req.params
        const instance = new AggregatorProcessor();
        const response = await instance.renderPG(request_payload)
        
        if (response.action == ActionType.HTMLSTRING){
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(response.htmlString);
        }
        else {
            console.log(response)
            res.status(307).render(response.action, response);
        }
    } catch (error) {
        next(error);
    }
};

//@desc get payment details
//@route GET /api/v1/payment_session/:gid
//@access public
exports.getPaymentDetailsHandler = async (req, res, next) => {
    try {
        let request_payload = {
            ...req.params,
            ...req.query,
            ...req.body
        };
        request_payload['headers'] = {...req.headers}
        const instance = new AggregatorProcessor();
        const response = await instance.getPaymentDetails(request_payload);
        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

//@desc payment completion callback
//@route GET /api/v1/payment_callback/:gid
//@access public
exports.paymentCallbackHandler = async (req, res, next) => {
    try {
        req.body.responseData = JSON.parse(req.body.responseData);
        let request_payload = {
            ...req.params,
            ...req.query,
            ...req.body
        };
        request_payload['headers'] = {...req.headers}
        const instance = new AggregatorProcessor();
        const response = await instance.processCallback(request_payload);
        return res.status(308).render(ActionType.REDIRECT, response);
    } catch (error) {
        next(error);
    }
};

//@desc create refund aggregator
//@route POST /api/v1/payment_session/:gid/refund
//@access public
exports.refundHandler = async (req, res, next) => {
    try {
        let request_payload = {
            ...req.body
        };
        const instance = new AggregatorProcessor();
        const response = await instance.processRefund(request_payload);
        return res.status(202).json(response);
    } catch (error) {
        next(error);
    }
};

//@desc payment status update webhook
//@route POST /api/v1/webhook/payment
//@access public
exports.processWebhook = async (req, res, next) => {
    try {
        let requestPayload = {
            data: req.body,
            headers: req.headers
        };

        const instance = new AggregatorProcessor();
        await instance.processWebhook(requestPayload)
        return res.status(200).json({
            success: true,
        });
    } catch (error) {
        next(error);
    }
};

//@desc refund status webhook
//@route POST /api/v1/webhook/refund
//@access public
exports.processRefundWebhook = async (req, res, next) => {
    try {
        const webhook_payload = req.body;
        webhook_payload["checksum"] = req.headers["checksum"];
        const instance = new AggregatorProcessor();
        await instance.processRefundWebhook(webhook_payload)
        return res.status(200).json({
            success: true,
        });
    } catch (error) {
        next(error);
    }
};

// can be merged with above webhook?
//@desc refund status webhook
//@route POST /api/v1/webhook/refund
//@access public
exports.processPaymentUpdateStatus = async (req, res, next) => {
    try {
        let requestPayload = {
            data: req.body,
            headers: req.headers
        };
        const instance = new AggregatorProcessor();
        const response = await instance.processPaymentUpdateStatus(requestPayload)
        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

exports.processPaymentCancelHandler = async (req, res, next) => {
    try {
        let requestPayload = {
            ...req.params,
            ...req.query,
            ...req.body
        };
        requestPayload['headers'] = {...req.headers}
        const instance = new AggregatorProcessor();
        const response = await instance.processPaymentCancel(requestPayload);
        logger.info('Cancel Handler Response: %O', JSON.stringify(response));
        return res.status(200).redirect(response.cancelUrl);
    } catch (error) {
        next(error);
    }
};

//@desc: shipment update 
//@route POST /api/v1/payment/shipment
//@access public
exports.processShipmentUpdate = async (req, res, next) => {
    try {
        const requestPayload = req.body;
        const instance = new AggregatorProcessor();
        const response = await instance.processShipmentUpdate(requestPayload);
        return res.status(200).json(response)
    } catch (error) {
        next(error);
    }
};

//@desc: customer validation
//@route POST /api/v1/customer/validation
//@access public
exports.validateCustomer = async (req, res, next) => {
    try {
        const requestPayload = req.body;
        const instance = new AggregatorProcessor();
        const response = await instance.validateCustomer(requestPayload)
        return res.status(200).json(response)
    } catch (error) {
        next(error);
    }
}