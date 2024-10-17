const asyncHandler = require("express-async-handler");
const { httpStatus } = require("../../constants");
const config = require("../config");
const { Secret } = require("../models/models");
const EncryptHelper = require("../utils/encryptUtils");
const { deleteKeyFromRedis } = require("../utils/aggregatorUtils");


const CREDENTIAL_FIELDS = [
    { name: "API token", slug: "api_token", required: true, display: true },
];

//@desc create merchant credentials
//@route POST /api/v1/secrets
//@access private
exports.createSecretsHandler = asyncHandler(async (req, res) => {
    let app_id = req.params.app_id;  // req.body.app_id;
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
//@access private
exports.getSecretsHandler = asyncHandler(async (req, res) => {
    const app_id = req.params.app_id;
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
