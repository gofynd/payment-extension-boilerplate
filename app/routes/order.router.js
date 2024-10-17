const express = require("express");
const { verifyPlatformChecksum, verifyStatusChecksum } = require('../middleware/verifyChecksum');
const {
    createOrderHandler,
    getPaymentDetailsHandler,
    paymentCallbackHandler,
    refundHandler,
    getRefundDetailsHandler,
    processWebhook,
    processRefundWebhook,
} = require("../controllers/orderController")

const orderRouter = express.Router();

orderRouter.post('/payment_session/:gid', verifyPlatformChecksum, createOrderHandler);
orderRouter.get('/payment_session/:gid', verifyStatusChecksum, getPaymentDetailsHandler);

orderRouter.post('/payment_session/:gid/refund', verifyPlatformChecksum, refundHandler);
orderRouter.get('/payment_session/:gid/refund', verifyStatusChecksum, getRefundDetailsHandler);

orderRouter.post('/payment_callback', paymentCallbackHandler);

orderRouter.post('/webhook/payment', processWebhook);
orderRouter.post('/webhook/refund', processRefundWebhook);

module.exports = orderRouter.getRouter();
