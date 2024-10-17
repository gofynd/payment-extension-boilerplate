'use strict';

const asyncHandler = require("express-async-handler");
const { httpStatus } = require("../../constants");
const { NotFoundError, BadRequestError } = require("../common/customError");
const config = require("../config");
const logger = require("../common/logger");
const { AggregatorStatusMapper, Secret } = require("../models/models");
const EncryptHelper = require("../utils/encryptUtils");
const { deleteKeyFromRedis } = require("../utils/aggregatorUtils");


const CREDENTIAL_FIELDS = [
    { name: "Channel ID", slug: "channelId", required: true, display: true },
    { name: "Transaction Type", slug: "transactionType", required: true, display: true },
    { name: "Circle ID", slug: "circleId", required: true, display: true },
    { name: "Checksum Key", slug: "checksum_key", required: true, display: true },
    { name: "Refund Checksum Key", slug: "refund_checksum_key", required: true, display: true },
    { name: "API Domain", slug: "api_domain", required: true, display: true, value: "https://rtss-sit.jioconnect.com/jiopaypg" },
    { name: "Encrypt Secret", slug: "encrypt_secret", required: false, display: true },
    { name: "Encrypt IV", slug: "encrypt_iv", required: false, display: true },
    { name: "Payment Link", slug: "payment_link", required: false, display: false, tip: "API domain of Jioonepay Payment Link" },
    { name: "API Domain Wallet", slug: "api_domain_wallet", required: false, display: true, value: "https://rrsatrpos01.ril.com/DEV_JPMWalletAPI/api/v1.0/JPMWalletPayment", tip: "API domain for wallet refunds" },
    { name: "Wallet Refund URL", slug: "wallet_refund_url", required: false, display: true, value: "https://devfin.ril.com/WalletCreditRefundAPI/api/v1.0/ClosedLoopRefunds", tip: "Refund URL meant for JM wallet/Giftcard/Employee Gift Card refunds." },
    { name: "Merchant Id", slug: "merchant_id", required: false, display: true },
    { name: "Business Flow", slug: "business_flow", required: false, display: true },
    { name: "Business Type", slug: "business_type", required: false, display: true },
    { name: "RONE User ID", slug: "rone_uid", required: false, display: true },
    { name: "RONE User Password", slug: "rone_pass", required: false, display: true },
    { name: "RONE Checksum Key", slug: "rone_checksum_key", required: false, display: true },
    { name: "RONE G-UID", slug: "rone_g_uid", required: false, display: true },
    { name: "RONE StoreNo", slug: "rone_store_no", required: false, display: true, value: "R280" },
    { name: "RONE Refund URL", slug: "rone_refund_url", required: false, display: true },
    { name: "Success URL", slug: "success_redirect_url", required: false, display: true, tip: "Payment Success URL for custom redirection" },
    { name: "Failed URL", slug: "failed_redirect_url", required: false, display: true, tip: "Payment Failure URL for custom redirection" },
    { name: "COD Eligibility URL", slug: "cod_eligibility_url", required: false, display: true },
    { name: "Action", slug: "action", required: false, display: true, value: "redirect", tip: "Supports json and redirect. Default value is redirect." },
];

//@desc create merchant credentials
//@route POST /api/v1/secrets
//@access private TODO: add auth
exports.createSecretsHandler = asyncHandler(async (req, res, next) => {
    // TODO: update request to object {slug: value ...} instead of [{slug: slug, value: value}, ...]
    let app_id = req.headers['x-application-id'];  // req.body.app_id;
    let creds = req.body.data;
    let data = {};
    for (var i = 0; i < creds.length; i++) {
        data[creds[i].slug] = creds[i].value;
    }
    let secrets = EncryptHelper.encrypt(config.extension.encrypt_secret, JSON.stringify(data));

    await Secret.findOneAndUpdate(
        { app_id: app_id },
        {
            secrets: secrets,
        },
        { upsert: true, new: false }
    );

    const REDIS_KEY = `${config.extension_slug}:MerchantAggregatorConfig:appId:${app_id}`;
    secrets = await deleteKeyFromRedis(REDIS_KEY);
    if (req.path.startsWith('/secrets')) {
        res.status(httpStatus.CREATED).json({
            success: true
        });
    } else {
        res.status(httpStatus.CREATED).json(data);
    }
});

//@desc get merchant credentials
//@route GET /api/v1/secrets
//@access private TODO: add auth
exports.getSecretsHandler = asyncHandler(async (req, res, next) => {
    let secret = await Secret.findOne({ app_id: req.params.app_id })
    if (!secret) {
        res.status(httpStatus.OK).json({
            success: true,
            is_active: false,
            app_id: req.params.app_id,
            data: CREDENTIAL_FIELDS
        });
        return res;
    }
    let data = EncryptHelper.decrypt(config.extension.encrypt_secret, secret.secrets);
    let creds = []
    for (var i = 0; i < CREDENTIAL_FIELDS.length; i++) {
        creds.push({
            "slug": CREDENTIAL_FIELDS[i].slug,
            "name": CREDENTIAL_FIELDS[i].name,
            "required": CREDENTIAL_FIELDS[i].required,
            "display": CREDENTIAL_FIELDS[i].display,
            "tip": CREDENTIAL_FIELDS[i].tip,
            "value": data[CREDENTIAL_FIELDS[i].slug]
        })
    }
    const responseData = {
        success: true,
        app_id: req.params.app_id,
        is_active: true,
        data: req.path.startsWith('/secrets')? []: creds
    }
    res.status(httpStatus.OK).json(responseData);
});


exports.createStatusMapperHandler = asyncHandler(async (req, res, next) => {
    if (!req.body.journey_type) {
        res.status(httpStatus.BAD_REQUEST).json({
            "success": false,
            "error": "Required paramter is missing: journey_type"
        });
    } else {
        if (!["forward", "refund"].includes(req.body.journey_type)) {
            res.status(httpStatus.BAD_REQUEST).json({
                "success": false,
                "error": "Unknown value in journey_type"
            });
        }
    }
    if (!req.body.aggregator_status) {
        res.status(httpStatus.BAD_REQUEST).json({
            "success": false,
            "error": "Required paramter is missing: aggregator_status"
        });
    }
    if (!req.body.status) {
        res.status(httpStatus.BAD_REQUEST).json({
            "success": false,
            "error": "Required paramter is missing: status"
        });
    }
    try {
        const statusMapper = await AggregatorStatusMapper.create({
            journey_type: req.body.journey_type,
            aggregator_status: req.body.aggregator_status,
            status: req.body.status
        });
        res.status(httpStatus.CREATED).json({
            "success": true,
            "data": statusMapper
        });
    } catch (error) {
        logger.error(error)
        res.status(httpStatus.BAD_REQUEST).json({
            "success": false,
            "error": error
        });
    }
});

exports.getStatusMapperHandler = asyncHandler(async (req, res, next) => {
    if (req.query.journey_type) {
        if (!["forward", "refund"].includes(req.query.journey_type)) {
            res.status(httpStatus.BAD_REQUEST).json({
                "success": false,
                "error": "Unknown value in journey_type"
            });
        }
    }
    const statusMapper = await AggregatorStatusMapper.find(req.query);
    res.status(httpStatus.OK).json({
        "success": true,
        "data": statusMapper
    });
});

exports.updateStatusMapperHandler = asyncHandler(async (req, res, next) => {
    let message = ""
    let success = true
    if (!req.body.journey_type) {
        success = false;
        message = "Required paramter is missing: journey_type";
    } else {
        if (!["forward", "refund"].includes(req.body.journey_type)) {
            success = false;
            message = "Unknown value in journey_type";
        }
    }
    if (!req.body.aggregator_status) {
        success = false;
        message = "Required paramter is missing: aggregator_status";
    }
    if (!req.body.status) {
        success = false;
        message = "Required paramter is missing: status";
    }

    if (!success) {
        throw new BadRequestError(message);
    }

    try {
        const statusMapper = await AggregatorStatusMapper.updateOne(
            {
                journey_type: req.body.journey_type,
                aggregator_status: req.body.aggregator_status
            },
            {
                $set: { status: req.body.status }
            }
        );
        res.status(httpStatus.CREATED).json({
            "success": true,
            "data": statusMapper
        });
    } catch (error) {
        res.status(httpStatus.SERVER_ERROR).json({
            "success": false,
            "error": error
        });
    }
});


exports.deleteStatusMapperHandler = asyncHandler(async (req, res, next) => {
    if (req.query.journey_type) {
        if (!["forward", "refund"].includes(req.query.journey_type)) {
            res.status(httpStatus.BAD_REQUEST).json({
                "success": false,
                "error": "Unknown value in journey_type"
            });
        }
    }
    if (!req.query.aggregator_status) {
        res.status(httpStatus.BAD_REQUEST).json({
            "success": false,
            "error": "Required paramter is missing: aggregator_status"
        });
    }
    const statusMapper = await AggregatorStatusMapper.deleteOne({
        aggregator_status: req.query.aggregator_status,
        journey_type: req.query.journey_type
    });
    res.status(httpStatus.OK).json({
        "success": true,
        "data": statusMapper
    });
});