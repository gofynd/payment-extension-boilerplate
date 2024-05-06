const express = require('express');
const orderRouter = express.Router();
const { verifyPlatformChecksum, verifyFrontendChecksum } = require('../middleware/verifyChecksum');
const {
    createOrderHandler,
    processWebhook,
    paymentCallbackHandler,
    refundHandler,
    processRefundWebhook,
    renderPGHandler,
    getPaymentDetailsHandler
} = require("../controllers/orderController")


orderRouter.post('/payment_session/:gid', verifyPlatformChecksum, createOrderHandler);
orderRouter.get('/payment_session/:gid', verifyPlatformChecksum, getPaymentDetailsHandler);

orderRouter.get('/payment_callback/:gid', paymentCallbackHandler);
orderRouter.post('/payment_callback', paymentCallbackHandler);

orderRouter.post('/payment_session/:gid/refund', verifyPlatformChecksum, refundHandler);
orderRouter.post('/webhook/payment', processWebhook);
orderRouter.post('/webhook/refund', processRefundWebhook);
orderRouter.get('/pgloader/:_id', renderPGHandler);

// add mock pg route for success or failure

module.exports = orderRouter;
