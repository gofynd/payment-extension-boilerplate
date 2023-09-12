'use strict';

const asyncHandler = require("express-async-handler");
const { httpStatus } = require("../../constants");
const { NotFoundError, BadRequestError } = require("../common/customError");
const config = require("../config");
const logger = require("../common/logger");
const { AggregatorStatusMapper, Secret } = require("../models/models");
const EncryptHelper = require("../utils/encryptUtils");
const { deleteKeyFromRedis } = require("../utils/aggregatorUtils");

// display flag displays field on the credentials page of onbording.
const CREDENTIAL_FIELDS = [
    {name: "Creds field 1", slug: "cred1", required: true, display: true},
    {name: "Creds field 2", slug: "cred2", required: true, display: true},
    {name: "Creds field 3", slug: "cred3", required: true, display: true},
]

//@desc create merchant credentials
//@route POST /api/v1/secrets
//@access private
exports.createSecretsHandler = asyncHandler(async (req, res, next) => {
    let app_id = req.body.app_id;
    let creds = req.body.data;
    let data = {};
    for (var i=0;i<creds.length;i++){
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

    res.status(httpStatus.CREATED).json(data);
});

//@desc get merchant credentials
//@route GET /api/v1/secrets
//@access private
exports.getSecretsHandler = asyncHandler(async (req, res, next) => {
    logger.info("secrets for app_id %s", req.params.app_id);
    let secret = await Secret.findOne({ app_id: req.params.app_id })
    if (!secret) {
        res.status(httpStatus.OK).json({
            success: true,
            app_id: req.params.app_id,
            data:CREDENTIAL_FIELDS
        });
        return res;
    }
    let data = EncryptHelper.decrypt(config.extension.encrypt_secret, secret.secrets);
    let creds = []
    for (var i=0; i<CREDENTIAL_FIELDS.length; i++) {
        creds.push({
            "slug": CREDENTIAL_FIELDS[i].slug,
            "name": CREDENTIAL_FIELDS[i].name,
            "required": CREDENTIAL_FIELDS[i].required,
            "display": CREDENTIAL_FIELDS[i].display,
            "value": data[CREDENTIAL_FIELDS[i].slug]
        })
    }

    res.status(httpStatus.OK).json({
        success: true,
        app_id: req.params.app_id,
        data: creds
    });
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