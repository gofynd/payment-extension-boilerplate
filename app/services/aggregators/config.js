exports.aggregatorConfig = {
    'createOrder': '/initiate/payment/request',
    'refund': '/api/v2/initiate-refund',
    'orderStatus': '/v2/payment/txn-status',
    'resendPayment': '/rposasp/resend/paymentlink',
    'refundStatus': '/api/v2/refund-status',
    'walletRefund': '/api/v1.0/JPMWalletPayment',
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
