exports.aggregatorConfig = {
    'createOrder': '/initiate/payment/request',
    'refund': '/api/v2/initiate-refund',
    // 'orderStatus': '/v1/payment/status',
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

exports.jioRefundMopMapping = {
    "RONE": ["349", "250", "5"],
    "COD": ["20"],
    "YESBANKUPI": ["187"],
    "PaytmPG": ["189"],
    "MOBIKWIK": ["190"],
    "PHONEPE": ["191"],
    "JMPAYPG": ["192"],
    "JMPAYPG": ["202"],
    "CCAVENUE": ["232"],
    "PINELABPG_DISCOUNT": ["210"],
    "PINELABPG": ["211"],
    "TWID": ["297"],
    "SIMPL": ["296"],
    "SuperMoney": ["345"]
}

exports.jioMopMapping = {
    'DC': 'CARD',
    'CC': 'CARD',
    'Debit Card': 'CARD',
    'Credit Card': 'CARD',
    'Card Payment': 'CARD',
    '20': 'COD',
    'COD': 'COD',
    'Net Banking': 'NB',
    'NB': 'NB',
    'UPI': 'UPI',
    'Unified Payments': 'UPI',
    'Wallet': 'WL',
    'Mobile Wallet': 'WL',
    'Paytm': 'WL',
    'FlexiPay': 'PL',
    'Paytm Postpaid': 'PL',
    'OlaMoney': 'PL',
    'BNPL': 'PL',
    '04': 'CARD',
    '05': 'CARD',
    '06': 'NB',
    '11': 'WL',
    '23': 'UPI',
    '20': 'COD',
    '04': 'CARD',
    '05': 'CARD',
    '06': 'NB',
    '11': 'Wallet',
    '23': 'UPI',
    '20': 'COD',
    '345': 'SuperMoney',
}

exports.departmentMapping = {
    electronics: "JIOMARTDIGITAL",
    digital: "JIOMARTDIGITAL",
    jewellery: "JIOJEWELS",
    groceries: "JIOGROCERIES",
    grocery: "JIOGROCERIES",
    others: "JIONONGROCERY"
}