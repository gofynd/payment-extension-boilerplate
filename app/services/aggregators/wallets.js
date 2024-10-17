const { getHmacChecksum } = require("../../utils/signatureUtils");
const { getISTDateTime } = require("../../utils/dateUtils");
const { makeRequest } = require("../../utils/aggregatorUtils");
const { aggregatorConfig } = require("./config");
const { User } = require("../../models/models");
const { httpStatus } = require("../../../constants");
const { BadRequestError } = require("../../common/customError");

// PERFIOS
// perfios.secret.key=OINGTRE12DSDL19PINGTRE19POL15EDPOL15EDP16FASHSDLO16FASHAHK12DAHK
// perfios.header.merchantid=JIOMARTPARTNER
// perfios.header.businessFlow=JIOMARTPARTNER
// perfios.metro.secret.key=DJSLKDJSLDEWIEOIWEAMIWERWKETASSDSJDKLSDSLJDKLSDJSLKDJSLLSKDKJSDHFSHWIERUWOSDFBQWEQIOUWEORWSDFKBBSDFFJKLSDSSDSDSDDSDSDSDSDSDSDSD
// perfios.header.metro.merchantid=METROCCJOP230823
// perfios.header.metro.businessFlow=METROCC

// RONE
// jio.rone.wallet.businessType =JCP
// jio.rone.wallet.mop =250
// jio.rone.wallet.metro.mop=349
// jio.rone.wallet.metro.businessType=JCPM


function createRonePayload(data, secretsDict) {
    if (data.mop == "5") data.mop = "349";
    return {
        "Amount": `${(data.amount / 100).toFixed(2)}`,
        "ShipmentId": data.meta.forwardTransactionId,
        "MobileNum": data.customer_contact,
        "StoreNo": data.storeCode || secretsDict.rone_store_no,
        "AirmailId": data.meta.forwardTransactionId,
        "OrderID": data.meta.forwardTransactionId,
        "Format": secretsDict.rone_refund_url ? "" : "RELSMART",
        "TaxInvoiceNo": data.meta.forwardTransactionId,
        "BusinessType": secretsDict.business_type,
        "Action": secretsDict.rone_refund_url ? "Reversal" : "WALLET_REFUND",
        "MOP": data.mop, // data.meta.payment_mode,
        "Reason": "Reversal",
        "Token": "F",
        "approval_Code": data.forwardPaymentId,
        "invoice_Number": data.invoiceNumber,
    }
}

async function createRoneRefund(data, secretsDict) {
    const { rone_uid, rone_pass, rone_checksum_key, rone_g_uid, rone_store_no, rone_refund_url } = secretsDict;
    if (!rone_uid || !rone_pass || !rone_checksum_key || !rone_g_uid || !rone_store_no || !rone_refund_url) {
        throw new BadRequestError("Missing RONE refund credentials.");
    }
    const payload = createRonePayload(data, secretsDict)
    const url = rone_refund_url;
    const headers = {
        "Authorization": `Basic ${btoa(`${rone_uid}:${rone_pass}`)}`,
        "X-Checksum": getHmacChecksum(JSON.stringify(payload), rone_checksum_key).toUpperCase(),
        "Guid": rone_g_uid,
        "Content-Type": "application/json"
    }
    const logData = {
        purpose: "initiating ROne refund",
        entityName: "order id",
        entityValue: payload.OrderID
    }
    const response = await makeRequest({
        method: 'post',
        url,
        data: payload,
        headers,
        logData
    });
    return response;
}

async function createJMWalletRefund(data, secretsDict) {
    const { rone_store_no, wallet_refund_url } = secretsDict;
    if (!wallet_refund_url) {
        throw new BadRequestError("Missing JMWALLET/GIFTCARD/EGV refund credentials.");
    }
    const mop_mapping = {
        "JM_WALLET": 119,
        "JMWALLET": 119,
        "GIFTCARD": 274,
        "EGV": 120
    }
    const payload = {
        "MOPId": mop_mapping[data.payment_mode],
        "MobileNo": data.customer_contact,
        "AirmailId": data.fynd_platform_id,
        "RefundAmt": data.amount / 100,
        "StoreCode": data.storeCode || rone_store_no || "JIOM",
        "TransDate": getISTDateTime(true, format="dd-MM-yyyy"),
        "ShipmentId": data.request_id,
        "ApprovalCode": data.forwardPaymentId
    };
    const url = wallet_refund_url;
    const headers = {
        "Content-Type": "application/json"
    };
    const logData = {
        purpose: `initiating ${data.payment_mode} refund`,
        entityName: "order id",
        entityValue: data.fynd_platform_id
    }
    const response = await makeRequest({
        method: 'post',
        url,
        data: payload,
        headers,
        logData
    });
    return response;
}

function createPerfiosPayload(data, user) {
    return {
        "clientTransactionId": data.forwardPaymentId,
        "clientOrderRefNumber": data.fynd_platform_id,
        "clientOrderCancellationId": data.request_id,
        "cancelAmount": `${(data.amount / 100).toFixed(2)}`,
        "customerId": "",
        "merchantMobile": user.mobile,
        "userId": data.g_user_id
    };
}

async function processWalletRefund(data, secretsDict) {
    const user = await User.findOne({
        g_user_id: data.g_user_id,
    });

    let payload = {};
    if (data.payment_mode?.toLowerCase() == "rone") {
        payload = createRonePayload(data, secretsDict);
    } else if (data.payment_mode?.toLowerCase() == "perfios") {
        payload = createPerfiosPayload(data, user);
    }

    const url = secretsDict.api_domain_wallet + aggregatorConfig.walletRefund;
    const amount = `${(data.amount / 100).toFixed(2)}`;
    const trxnTime = Math.floor(Date.now() / 1000);

    const checksum = `${secretsDict.merchant_id}|${secretsDict.business_flow}|${trxnTime}|${data.mobile}|${amount}`;
    const headers = {
        'x-signature': getHmacChecksum(checksum, secretsDict.refund_checksum_key).toUpperCase(),
        'x-merchant-id': secretsDict.merchant_id,
        'x-business-flow': secretsDict.business_flow,
        'x-transaction-time': trxnTime,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    const logData = {
        purpose: 'initiating wallet refund',
        entityName: "order id",
        entityValue: data.fynd_platform_id
    }
    const response = await makeRequest({
        method: "post",
        url: url,
        data: payload,
        headers: headers,
        logData
    });
    return response;
}

async function createWalletRefund(data, secretsDict) {
    /*
    Chxecksum Pattern:
        transactionRefNumber|transactionDateTime|paymentRefNumber|instrumentReference|totalAmount

    Sample API response
    {
        "success": true,
        "refundId": "17900538649020039A757",
        "transactionRefNumber": "17900538649020039A"
    }
    */
    let response;

    if (data.payment_mode.toUpperCase() == "RONE" && secretsDict.rone_refund_url) {
        // For jiomart only, in existing env old flow will be used
        response = await createRoneRefund(data, secretsDict);
    }
    else if (["JM_WALLET", "JMWALLET", "GIFTCARD", "EGV"].includes(data.payment_mode.toUpperCase())) {
        // For jiomart only, in existing env old flow will be used
        response = await createJMWalletRefund(data, secretsDict);
    } else {
        response = await processWalletRefund(data, secretsDict);
    }
    let status = null;
    if (
        response.status === httpStatus.OK &&
        (response.data.errorcode == 0 || response.data.ErrorMsg == "Success")
    ) {
        response.data.success = true;
        response.data.refund_status = "refund_done";
    }
    else {
        response.data.success = false;
        response.data.refund_status = "refund_failed"
        response.data.errors = response.data.ErrorMsg
    }

    return response;
}
module.exports = createWalletRefund;