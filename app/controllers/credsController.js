'use strict';

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
//@access private TODO: add auth
exports.createSecretsHandler = async (req, res, next) => {
    try {
        let app_id = req.headers['x-application-id'];
        let creds = req.body.data;
        let data = {};
        for (var i=0;i<creds.length;i++){
            data[creds[i].slug] = creds[i].value;
        }
        console.log(`creating secrets for app_id: ${app_id}`);

        let secrets = EncryptHelper.encrypt(config.extension.api_secret, JSON.stringify(data));

        await Secret.findOneAndUpdate(
            { app_id: app_id },
            {
                secrets: secrets
            },
            { upsert: true, new: false }
        );

        const REDIS_KEY = `${config.extension_slug}:MerchantAggregatorConfig:appId:${app_id}`;
        secrets = await deleteKeyFromRedis(REDIS_KEY);

        res.status(201).json(data);
    } catch (error) {
        next(error);
    }
};

//@desc get merchant credentials
//@route GET /api/v1/secrets
//@access private TODO: add auth
exports.getSecretsHandler = async (req, res, next) => {
    try {
        let secret = await Secret.findOne({ app_id: req.params.app_id })
        if (!secret) {
            res.status(200).json({
                success: true,
                app_id: req.params.app_id,
                is_active: false,
                data:CREDENTIAL_FIELDS
            });
            return res;
        }
        let data = EncryptHelper.decrypt(config.extension.api_secret, secret.secrets);
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

        res.status(200).json({
            success: true,
            app_id: req.params.app_id,
            is_active: true,
            data: creds
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteCredentialsHandler = async (req, res, next) => {
    try {
        const { company_id } = req.body;
        console.log(`Uninstalling extension for company: ${company_id}`);
        await Secret.deleteMany({ company_id: company_id });
        res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
};

exports.getCredentials = async (req, res, next) => {
    try {
        logger.info("secrets for app_id %s", req.params.app_id);
        let secret = await Secret.findOne({ app_id: req.params.app_id })
        let data = {};
        if (secret) {
            data = EncryptHelper.decrypt(config.extension.api_secret, secret.secrets);
        }
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
        res.render('../../public/credentials.ejs', { params: creds });
    } catch (error) {
        next(error);
    }
};

exports.setCredentials = async (req, res, next) => {
    try {
        let app_id = req.params.app_id;
        let data = req.body;
        const companyId = req.headers['x-company-id'];
        let secrets = EncryptHelper.encrypt(config.extension.api_secret, JSON.stringify(data));

        await Secret.findOneAndUpdate(
            { app_id: app_id },
            {
                secrets: secrets,
                company_id: companyId
            },
            { upsert: true, new: false }
        );

        res.status(201).json({});
    } catch (error) {
        next(error);
    }
};

exports.createStatusMapperHandler = async (req, res, next) => {
    try {
        if (!req.body.journey_type) {
            res.status(400).json({
                "success": false,
                "error": "Required paramter is missing: journey_type"
            });
            return;
        }
        if (!["forward", "refund"].includes(req.body.journey_type)) {
            res.status(400).json({
                "success": false,
                "error": "Unknown value in journey_type"
            });
            return;
        }
        if (!req.body.aggregator_status) {
            res.status(400).json({
                "success": false,
                "error": "Required paramter is missing: aggregator_status"
            });
            return;
        }
        if (!req.body.status) {
            res.status(400).json({
                "success": false,
                "error": "Required paramter is missing: status"
            });
            return;
        }

        const statusMapper = await AggregatorStatusMapper.create({ 
            journey_type: req.body.journey_type,
            aggregator_status: req.body.aggregator_status,
            status: req.body.status
        });
        res.status(201).json({
            "success": true,
            "data": statusMapper
        });
    } catch (error) {
        next(error);
    }
};

exports.getStatusMapperHandler = async (req, res, next) => {
    try {
        if (req.query.journey_type) {
            if (!["forward", "refund"].includes(req.query.journey_type)) {
                res.status(400).json({
                    "success": false,
                    "error": "Unknown value in journey_type"
                });
                return;
            }
        }
        const statusMapper = await AggregatorStatusMapper.find(req.query);
        res.status(200).json({
            "success": true,
            "data": statusMapper
        });
    } catch (error) {
        next(error);
    }
};

exports.updateStatusMapperHandler = async (req, res, next) => {
    try {
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

        const statusMapper = await AggregatorStatusMapper.updateOne(
            {
                journey_type: req.body.journey_type,
                aggregator_status: req.body.aggregator_status
            },
            {
                $set: { status: req.body.status }
            }
        );
        res.status(201).json({
            "success": true,
            "data": statusMapper
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteStatusMapperHandler = async (req, res, next) => {
    try {
        if (req.query.journey_type) {
            if (!["forward", "refund"].includes(req.query.journey_type)) {
                res.status(400).json({
                    "success": false,
                    "error": "Unknown value in journey_type"
                });
                return;
            }
        }
        if (!req.query.aggregator_status) {
            res.status(400).json({
                "success": false,
                "error": "Required paramter is missing: aggregator_status"
            });
            return;
        }
        const statusMapper = await AggregatorStatusMapper.deleteOne({
            aggregator_status: req.query.aggregator_status,
            journey_type: req.query.journey_type
        });
        res.status(200).json({
            "success": true,
            "data": statusMapper
        });
    } catch (error) {
        next(error);
    }
};