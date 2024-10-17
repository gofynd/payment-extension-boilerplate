const { Router } = require('homelander/router')
const orderRouter = new Router();
const { verifyGringottsChecksum, verifyStatusChecksum, verifyFrontendChecksum } = require('../middleware/verifyChecksum');
const {
    createOrderHandler,
    processWebhook,
    paymentCallbackHandler,
    refundHandler,
    processRefundWebhook,
    renderPGHandler,
    processPaymentUpdateStatus,
    getPaymentDetailsHandler,
    getRefundDetailsHandler,
    processPaymentCancelHandler
} = require("../controllers/orderController")


orderRouter.post('/payment_session/:gid', verifyGringottsChecksum, createOrderHandler);
orderRouter.get('/payment_session/:gid', verifyStatusChecksum, getPaymentDetailsHandler);

orderRouter.get('/payment_callback/:gid', paymentCallbackHandler);
orderRouter.post('/payment_callback', paymentCallbackHandler);

orderRouter.post('/payment_session/:gid/refund', verifyGringottsChecksum, refundHandler);
orderRouter.get('/payment_session/:gid/refund', verifyStatusChecksum, getRefundDetailsHandler);
orderRouter.post('/webhook/payment', processWebhook);
orderRouter.post('/webhook/refund', processRefundWebhook);
orderRouter.get('/pgloader/:_id', renderPGHandler);
orderRouter.post('/payment_update', processPaymentUpdateStatus);

orderRouter.get('/payment/cancel/:_id', processPaymentCancelHandler);

module.exports = orderRouter.getRouter();
