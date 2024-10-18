exports.aggregatorConfig = {
    'createOrder': '/api/payment/request',
    'orderStatus': '/api/payment/status',
    'createRefund': '/api/initiate-refund',
    'refundStatus': '/api/refund/status',
};

exports.paymentStatus = Object.freeze({
    INITIATED: 'initiated',
    PENDING: 'pending',
    COMPLETE: 'complete',
    FAILED: 'failed',
});

exports.refundStatus = Object.freeze({
    INITIATED: 'refund_initiated',
    PENDING: 'refund_pending',
    COMPLETE: 'refund_done',
    FAILED: 'refund_failed',
});

