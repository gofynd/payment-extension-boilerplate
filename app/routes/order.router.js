const express = require("express");
const { verifyPlatformChecksum, verifyStatusChecksum } = require('../middleware/verifyChecksum');
const {
    createOrderHandler,
    getPaymentDetailsHandler,
    paymentCallbackHandler,
    createRefundHandler,
    getRefundDetailsHandler,
    processWebhook,
    processRefundWebhook,
} = require("../controllers/orderController")

const orderRouter = express.Router();

orderRouter.post('/payment_session/:gid', verifyPlatformChecksum, createOrderHandler);
orderRouter.get('/payment_session/:gid', verifyStatusChecksum, getPaymentDetailsHandler);

orderRouter.post('/payment_session/:gid/refund', verifyPlatformChecksum, createRefundHandler);
orderRouter.get('/payment_session/:gid/refund', verifyStatusChecksum, getRefundDetailsHandler);

orderRouter.post('/payment_callback/:company_id/:app_id', paymentCallbackHandler);

orderRouter.post('/webhook/payment/:company_id/:app_id', processWebhook);
orderRouter.post('/webhook/refund/:company_id/:app_id', processRefundWebhook);

module.exports = orderRouter;
