exports.aggregatorConfig = {
    'createOrder': '/api/payment/request',
    'orderStatus': '/api/payment/status',
    'createRefund': '/api/initiate-refund',
    'refundStatus': '/api/refund/status',
};

exports.aggregatorStatusMapperConfig = {
    "started": "started",
    "Payment Pending": "pending",
    "Payment Received": "complete",
    "Expired": "failed",
    "Approved": "complete",
    "payment_approved": "complete",
    "payment_captured": "complete",
    "payment_refunded": "refund_done",
    "payment_refund_declined": "refund_failed",
    "payment_refund_pending": "refund_pending",
    "payment_authentication_failed": "failed",
    "unverified": "failed",
};
