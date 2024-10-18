const asyncHandler = require("express-async-handler");

const config = require("../config");
const EncryptHelper = require("../utils/encryptUtils");
const { fdkExtension } = require("../fdk/index");

const encryption_key = config.defaultEncryptionKey;

const CREDENTIAL_FIELDS = [
    { name: "API Key", slug: "api_key", required: true, display: true },
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
    // Use any encryption method
    let secrets = EncryptHelper.encrypt(encryption_key, JSON.stringify(data));

    // TODO: save secrets in custom meta
    let platformClient = await fdkExtension.getPlatformClient(company_id);

    res.status(httpStatus.CREATED).json(data);
});

//@desc get merchant credentials
//@route GET /api/v1/secrets
//@access private
exports.getSecretsHandler = asyncHandler(async (req, res) => {
    const app_id = req.params.app_id;

    // TODO: get secrets from custom meta
    const secrets = {};
    
    if (!secrets) {
        res.status(httpStatus.OK).json({
            success: true,
            is_active: false,
            app_id: app_id,
            data: CREDENTIAL_FIELDS
        });
        return res;
    }

    let data = EncryptHelper.decrypt(encryption_key, secrets);
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
