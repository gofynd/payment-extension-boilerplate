const AGGREGATOR_CONFIG = {
    'createOrder': '/initiate/payment/request',
    'refund': '/initiate-refund',
    'orderStatus': '/v1/payment/status',
    'resendPayment': '/rposasp/resend/paymentlink',
    'refundStatus': '/v2/refund-status',
};

const DEFAULT_CONFIG = {
    // Only keeping non-environment variables here
    FP_API_SERVER: 'https://api.fynd.com',
    GLOBAL_TTL: 60 * 60 * 24 * 180, // 180 days
};

module.exports = {
    AGGREGATOR_CONFIG,
    DEFAULT_CONFIG
}; 