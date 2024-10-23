const asyncHandler = require("express-async-handler");

const config = require("../config");
const { Secret } = require("../models/model");
const EncryptHelper = require("../utils/encryptUtils");

const encryption_key = config.encryption_key;

const CREDENTIAL_FIELDS = [
    { name: "API Key", slug: "api_key", required: true, display: true },
];

//@desc create merchant credentials
//@route POST /api/v1/secrets
//@access private
exports.createSecretsHandler = asyncHandler(async (req, res) => {
    const app_id = req.params.app_id;  // req.body.app_id;
    const company_id = req.params.company_id;
    const creds = req.body.data;
    const data = {};
    for (var i = 0; i < creds.length; i++) {
        data[creds[i].slug] = creds[i].value;
    }

    // Use any encryption method
    const encryptedSecret = EncryptHelper.encrypt(encryption_key, JSON.stringify(data));

    await Secret.create({
        app_id,
        company_id,
        secrets: encryptedSecret,
    })

    const response = {
        success: true,
        app_id: req.params.app_id,
        is_active: true,
        data: creds
    }
    res.status(200).json(response);
});

//@desc get merchant credentials
//@route GET /api/v1/secrets
//@access private
exports.getSecretsHandler = asyncHandler(async (req, res) => {
    const app_id = req.params.app_id;
    const company_id = req.params.company_id;

    // TODO: get secrets from custom meta
    // const encryptedSecret = "5f97e6a662f3198b8f6adf772b87020d:f6a18adea657f1b57ccfc0f1627be46c8333f167884a5320c6f636dfbe38a5e1";
    const encryptedSecret = await Secret.findOne({
        app_id,
        company_id,
    })

    if (!encryptedSecret) {
        res.status(200).json({
            success: true,
            is_active: false,
            app_id: app_id,
            data: CREDENTIAL_FIELDS
        });
        return res;
    }

    let secrets = EncryptHelper.decrypt(encryption_key, encryptedSecret.secrets);
    secrets = JSON.parse(secrets);

    let creds = []
    for (var i = 0; i < CREDENTIAL_FIELDS.length; i++) {
        creds.push({
            "slug": CREDENTIAL_FIELDS[i].slug,
            "name": CREDENTIAL_FIELDS[i].name,
            "required": CREDENTIAL_FIELDS[i].required,
            "display": CREDENTIAL_FIELDS[i].display,
            "tip": CREDENTIAL_FIELDS[i].tip,
            "value": secrets[CREDENTIAL_FIELDS[i].slug]
        })
    }
    const responseData = {
        success: true,
        app_id: req.params.app_id,
        is_active: true,
        data: req.path.startsWith('/secrets')? []: creds
    }
    res.status(200).json(responseData);
});
