const logger = require("../../common/logger");
const config = require("../../config");
const { getHmacChecksum } = require("../../utils/signatureUtils");
const { getISTDateTime, calculateTimeDelta } = require("../../utils/dateUtils");
const { getAggregatorStatusMapper, makeRequest, getRedisData, setRedisData } = require("../../utils/aggregatorUtils");
const EncryptHelper = require("../../utils/encryptUtils");
const removeTrailingSlash = require("../../utils/commonUtils");
const { departmentMapping } = require("./config");

function setProductSpecId(data, payload) {
    let cartDetails = data.lineItemData?.cart_details;
    let productspecid = []
    let totalAmount = cartDetails?.cart_value;
    let total_quantity = cartDetails?.total_quantity
    let is_service_product = false;
    let transactionType = payload.transactionType;
    let sodexoEligibleAmount = 0;
    let parentMerchantAmt = 0;
    let subMerchantAmt = 0;
    let characteristicsType = departmentMapping.others;
    let subMerchantName = null;
    let totalExchangeAmount = 0;
    const departments = new Set();
    let deliveryFee = 0;

    cartDetails?.cart_charges?.forEach((charge) => {
        if (charge?.code?.toLowerCase().includes('delivery')) {
            deliveryFee += (charge?.amount?.ordering_currency?.value || 0) / 100;
        }
    });

    cartDetails?.articles.forEach(article => {
        let productType = "1P"
        let quantity = article.quantity || 0
        let customJson = cartDetails?.items[article.item_id]._custom_json;
        let articleName = cartDetails?.items[article.item_id].name;
        let department = cartDetails?.items[article.item_id]?.attributes['vertical-code']?.toLowerCase()

        is_service_product = is_service_product || customJson?.is_service_product;
        totalExchangeAmount += (customJson?.exchange_price || 0.0);
        departments.add(department);
        // if (department == "jewellery")
        //     transactionType = "JIOJEWELS";
        // else if (transactionType != "JIOJEWELS" && department == "groceries")
        //     transactionType = "JIOGROCERIES";
        // else if (!transactionType && department == "electronics")
        //     transactionType = "JIOMARTDIGITAL";
        if (!article.tags)
            article.tags = [];
        if (
            !article.tags.includes("3P") // 1P is default. if 3P then false
        ) {
            // cartDetails?.items[article.item_id]?.attributes['is-sodexo-eligible'].toLowerCase() == 'true'
            sodexoEligibleAmount += (/^true$/i.test(cartDetails?.items[article.item_id]?.attributes['is-sodexo-eligible']) ? article.float_amount_paid : 0) * quantity;
            parentMerchantAmt += article.float_amount_paid * quantity;
        }
        else if (article.tags.includes("3P")) {
            subMerchantAmt += article.float_amount_paid * quantity;
            productType = "3P"
            subMerchantName = "3PVENDOR";
        }

        // let counter = 0;
        // let articlePrice = 0;
        // let totalCalculatedAmount = 0;

        // for (let i = 0; i < quantity; i++) {
        //     if (total_quantity - counter != 1) {
        //         counter += 1
        //         articlePrice = article.amount_paid
        //         totalCalculatedAmount += articlePrice
        //     } else {
        //         articlePrice = totalAmount - totalCalculatedAmount
        //     }
        // }
        if (article.amount_paid > 0) {
            const articlePrice = Number((quantity * article.float_amount_paid)?.toFixed(2));
            productspecid.push({
                "categoryId": cartDetails?.items[article.item_id]?.l3_categories[0].toString(),
                "brand": article.brand_id,
                "articleId": article.seller_identifier,
                "articleName": articleName,
                "articlePrice": `${articlePrice}`,
                "qty": quantity,
                "productType": productType,
                "vertical": department,
                "doorstep_finance": customJson?.doorstep_finance || false,
                "homeDeliveryItem": customJson?.homeDeliveryItem,
                "productEanId": article.ean,
                "exchange_price": customJson?.exchange_price
            })
        }
    });


    if (departments.size === 1) {
        const finalDepartment = [...departments][0];
        characteristicsType = departmentMapping[finalDepartment] || departmentMapping.others;
    }
    payload['transactionType'] = characteristicsType;
    payload['productSpecId'] = productspecid;

    payload['characteristics'].push(
        {
            'name': 'PAID_SERVICES_AVAILABLE',
            'value': is_service_product ?? false
        }
    );
    payload["paymentDetail"]["totalAmount"] = (payload.paymentDetail.totalAmount - totalExchangeAmount).toFixed(2);

    payload["paymentDetail"]["deliveryFee"] = deliveryFee > 0 ? `${deliveryFee.toFixed(2)}` : "0";
    payload["paymentDetail"]["sodexoEligibleAmount"] = sodexoEligibleAmount.toFixed(2) || 0.0;
    payload["paymentDetail"]["subMerchantName"] = subMerchantName;

    if (subMerchantAmt > 0) {
        payload["paymentDetail"]["parentMerchantAmt"] = parentMerchantAmt.toFixed(2) || 0.0;
        payload["paymentDetail"]["subMerchantAmt"] = subMerchantAmt.toFixed(2) || 0.0;
    }
}

async function getCheckoutPayload(data, secretsDict, customer) {

    const baseExt = removeTrailingSlash(config.extension.base_url);
    const callbackUrl = baseExt + '/api/v1/payment_callback';
    const webhookUrl = baseExt + '/api/v1/webhook/payment';
    const customerId = data.meta?.external_id || data.g_user_id;
    const customerName = customer.customer_name;

    // const epochTimestamp = Math.floor(new Date().getTime() / 1000);

    // let paramcsids = null;
    // if (customer.customer_contact) {
    //     const rawParamcsids = `${customerId}|${customer.customer_contact}-${epochTimestamp}`;
    //     paramcsids = getHmacChecksum(rawParamcsids, secretsDict.checksum_key);
    // }

    let productspecid = "";

    const cod_eligibility_url = secretsDict.cod_eligibility_url;

    let cod_eligibility = data.cod_eligibility;
    if (cod_eligibility_url) {
        const body = { ...data }
        body.cart = data.lineItemData;
        delete body.lineItemData;
        try {
            const logData = {
                purpose: "checking COD eligibility",
                entityName: "order id",
                entityValue: data.fynd_platform_id
            }
            const response = await makeRequest({
                method: 'POST',
                url: cod_eligibility_url,
                data: body,
                headers: {
                    'Content-Type': 'application/json',
                },
                logData
            });
            cod_eligibility = response.data.cod_eligibility;
        } catch (error) {
            logger.error('Error checking cod eligibility via URL', { error });
        }
    }

    let payload = {
        customerName,
        'paramcsids': "",
        'transactionDateTime': getISTDateTime(),
        'isQrCodeRequest': null,
        'agentCode': '',
        'isRedirect': null,
        'transactionRefNumber': data.fynd_platform_id,
        'description': 'Payment for Jio Partner Pay through Fynd platform',
        'merchantName': secretsDict.transactionType,
        'transactionType': secretsDict.transactionType,
        'notificationDestinations': [],
        'productSpecId': productspecid,
        'circleId': data.shipping_address.state,
        'paymentDetail': {
            'totalAmount': (data.amount / 100).toFixed(2),
            'currencyCode': data.currency,
            'codNotEligible': !cod_eligibility,
        },
        'expiryDateTime': calculateTimeDelta({ minutes: secretsDict.link_expiry }),
        'channelId': secretsDict.channelId,
        'characteristics': [
            {
                'name': 'CALLBACK_REF_NOTIFY_URL_S2S',
                'value': webhookUrl
            },
            {
                'name': 'CALLBACK_REF_NOTIFY_URL_B2B',
                'value': callbackUrl
            }
        ],
        'callbackparams': null,
        'source': 'WEB',
        'customerId': customerId,
        'additionalVariables': null,
    }

    setProductSpecId(data, payload);

    if (customer.customer_contact) {
        payload.notificationDestinations.push(
            { 'channel': 'SMS', 'destination': customer.customer_contact }
        )
    }
    if (customer.customer_email) {
        payload.notificationDestinations.push(
            { 'channel': 'EMAIL', 'destination': customer.customer_email }
        )
    }

    let key = {
        customerName,
        'callbackparams': null,
        'source': 'WEB',
        'SeqId': '1',
        'channel': '101',
        'storeid': data.meta?.store_code || null,
        'customerId': customerId,
        'additionalVariables': null,
    };

    payload = { ...payload, ...key };

    if (payload.notificationDestinations.length == 0) {
        delete payload.notificationDestinations;
    }
    return payload;
}

async function getCheckoutChecksum(payload, secretsDict) {
    let hash_payload = {
        'transactionRefNumber': payload['transactionRefNumber'],
        'transactionDateTime': payload['transactionDateTime'],
        'totalAmount': payload['paymentDetail']['totalAmount'],
        'paramcsids': payload.paramcsids,
    };
    const message = `${hash_payload.transactionRefNumber}|${hash_payload.totalAmount}|${hash_payload.transactionDateTime}`;
    const checksum = getHmacChecksum(message, secretsDict.checksum_key).toUpperCase();
    const log_data = { 'checksum': checksum, 'ChecksumPayload': hash_payload };
    return checksum.toUpperCase();
}

async function encryptCustomerDetails(data, secretsDict, customer) {
    const customer_name = customer.customer_name
    const parts = customer_name.split(" ")
    const first_name = parts[0]
    const middle_name = parts.slice(1, -1).join(" ")
    const last_name = parts.length > 1 ? parts[parts.length - 1] : ""

    let customer_details = {
        "custName": first_name,
        "custMName": middle_name,
        "custLName": last_name,
        "custMobile": customer.customer_contact,
        "custEmail": customer.customer_email,
        "custState": data.shipping_address.state,
        "custCity": data.shipping_address.city,
        "custPin": data.shipping_address.pincode,
        "custId": data.g_user_id,
        "storeNo": data.meta?.store_code || "",
        "flatNo": data.shipping_address?.meta?.flat_or_house_no || "",
        "floorNo": data.shipping_address?.meta?.flat_or_house_no || "",
        "blockNo": data.shipping_address?.meta?.block_no || "",
        "buildingName": data.meta?.shipping_address?.building_name || "",
        "societyName": data.shipping_address?.meta?.building_address || "",
        "plotNo": data.shipping_address?.meta?.plot_no || "",
        "street": data.meta?.shipping_address?.area_name || "",
        "sector": data.shipping_address?.meta?.sector || "",
        "area": data.meta?.shipping_address?.area_name || "",
        "country": data.shipping_address?.country || "",
    }

    const secret = Buffer.from(secretsDict.encrypt_secret, 'base64').toString('utf-8');
    return EncryptHelper.encryptAES(
        JSON.stringify(customer_details),
        secret,
        secretsDict.encrypt_iv
    ).gateway_secret
}


async function getLinkPayload(data, secretsDict, customer) {
    const baseExt = removeTrailingSlash(config.extension.base_url);
    const callbackUrl = baseExt + '/api/v1/payment_callback';
    const webhookUrl = baseExt + '/api/v1/webhook/payment';

    const customerId = data.meta?.external_id || data.g_user_id;
    const customerName = customer.customer_name;

    // const epochTimestamp = Math.floor(new Date().getTime() / 1000);

    // let paramcsids = null;
    // if (data.customer_contact) {
    //     const rawParamcsids = `${customerId}|${data.customer_contact}-${epochTimestamp}`;
    //     paramcsids = getHmacChecksum(rawParamcsids, secretsDict.checksum_key).toUpperCase();
    // }

    let payload = {
        customerName,
        "paramcsids": "",
        "transactionDateTime": getISTDateTime(),
        "isQrCodeRequest": null,
        "agentCode": "",
        "isRedirect": null,
        "transactionRefNumber": data.fynd_platform_id,
        "description": "Payment for Jio Partner Pay through Fynd platform",
        "merchantName": secretsDict.transactionType,
        "transactionType": secretsDict.transactionType,
        "notificationDestinations": [],
        "productSpecId": "",
        "circleId": data.shipping_address.state,
        "paymentDetail": {
            "totalAmount": (data.amount / 100).toFixed(2),
            "currencyCode": data.currency
        },
        'expiryDateTime': calculateTimeDelta({ "minutes": secretsDict.link_expiry ? secretsDict.link_expiry : 40 }),
        'channelId': secretsDict.channelId,
        'characteristics': [
            {
                'name': 'CALLBACK_REF_NOTIFY_URL_S2S',
                'value': webhookUrl
            },
            {
                'name': 'CALLBACK_REF_NOTIFY_URL_B2B',
                'value': callbackUrl,
            }
        ],

        "callbackparams": null,
        "source": "WEB",
        "customerId": customerId,
        "additionalVariables": null,
    }

    setProductSpecId(data, payload);

    if (customer.customer_contact) {
        payload.notificationDestinations.push(
            { 'channel': 'SMS', 'destination': customer.customer_contact }
        )
    }
    if (customer.customer_email) {
        payload.notificationDestinations.push(
            { 'channel': 'EMAIL', 'destination': customer.customer_email }
        )
    }


    if (data.payment_methods[0].code.toLowerCase() == 'jiopplink') {
        payload.isRedirect = "false"
    }


    if (secretsDict.encrypt_secret) {
        payload.customerDetails = await encryptCustomerDetails(data, secretsDict, customer);
    }

    let key = {
        customerName,
        "callbackparams": null,
        "source": "WEB",
        "SeqId": "1",
        "channel": "101",
        "storeid": data.meta?.store_code || "",
        "customerId": customerId,
        "additionalVariables": null,
    };

    payload = { ...payload, ...key };

    if (payload.notificationDestinations.length == 0) {
        delete payload.notificationDestinations;
    }
    return payload;
}

async function getLinkChecksum(payload, secretsDict) {
    let hash_payload = {
        "transactionRefNumber": payload["transactionRefNumber"],
        "transactionDateTime": payload["transactionDateTime"],
        "totalAmount": payload["paymentDetail"]["totalAmount"],
        "paramcsids": payload.paramcsids,
        "productCode": payload["productSpecId"],
        "sodexoEligibleAmount": "",
        "subMerchantName": "",
        "subMerchantAmt": "",
        "cashBackEligibleAmt": "",
        "productSpecId": "",
    };
    var message = `${hash_payload.transactionRefNumber}|${hash_payload.transactionDateTime}|${hash_payload.totalAmount}|${hash_payload.paramcsids}`;
    if (secretsDict.transactionType == 'FOFOSTORESPOL') {
        message = `${hash_payload.transactionRefNumber}|${hash_payload.totalAmount}|${hash_payload.transactionDateTime}`;
    }
    const checksum = getHmacChecksum(message, secretsDict.checksum_key).toUpperCase();
    const log_data = { "checksum": checksum, "payload": hash_payload };
    return checksum.toUpperCase();
}

module.exports = { getCheckoutPayload, getCheckoutChecksum, getLinkPayload, getLinkChecksum };