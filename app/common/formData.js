const { modulesIntegration } = require('@sentry/node');
const config = require('../config');

let CREDENTIAL_FIELDS = []
if (config.galaxy == 'jmp') {
    CREDENTIAL_FIELDS = [
        {name: "Channel Id", slug: "channelId", required: true, display: true},
        {name: "Transaction Type", slug: "transactionType", required: true, display: true},
        {name: "Circle Id", slug: "circleId", required: true, display: true},
        {name: "Checksum Key", slug: "checksum_key", required:true, display: true},
        {name: "Refund Checksum Key", slug: "refund_checksum_key", required: true, display: true},
        {name: "Payment Link", slug: "payment_link", required: false, display: false},
        {name: "API Domain", slug: "api_domain", required: false, display: true, value: "https://rtss-sit.jioconnect.com/jiopaypg"},
        {name: "API Domain Wallet", slug: "api_domain_wallet", required: true, display: true, value: "https://rrsatrpos01.ril.com/DEV_JPMWalletAPI/api/v1.0/JPMWalletPayment"},
        {name: "Merchant Id", slug: "merchant_id", required: false, display: true},
        {name: "Business Flow", slug: "business_flow", required: true, display: true},
        {name: "Business Type", slug: "business_type", required: true, display: true},
    ]
}
else {
    CREDENTIAL_FIELDS = [
        {name: "Channel Id", slug: "channelId", required: true, display: true},
        {name: "Transaction Type", slug: "transactionType", required: true, display: true},
        {name: "Circle Id", slug: "circleId", required: true, display: true},
        {name: "Checksum Key", slug: "checksum_key", required:true, display: true},
        {name: "Refund Checksum Key", slug: "refund_checksum_key", required: true, display: true},
        {name: "Payment Link", slug: "payment_link", required: false, display: false},
        {name: "Encrypt Secret", slug: "encrypt_secret", required: false, display: true},
        {name: "Encrypt IV", slug: "encrypt_iv", required: false, display: true},
        {name: "API Domain", slug: "api_domain", required: false, display: true, value: "https://rtss-sit.jioconnect.com/jiopaypg"},
    ]
}
module.exports = CREDENTIAL_FIELDS;