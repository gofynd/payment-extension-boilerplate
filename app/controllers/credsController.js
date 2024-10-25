const asyncHandler = require('express-async-handler');

const config = require('../config');
const { Secret } = require('../models/model');
const EncryptHelper = require('../utils/encryptUtils');

const { encryption_key: encryptionKey } = config;

const CREDENTIAL_FIELDS = [
  { name: 'API Key', slug: 'api_key', required: true, display: true },
];

// @desc create merchant credentials
// @route POST /api/v1/secrets
// @access private
exports.createSecretsHandler = asyncHandler(async (req, res) => {
  const { app_id: appId } = req.params; // req.body.app_id;
  const { company_id: companyId } = req.params;
  const creds = req.body.data;
  const data = {};
  for (let i = 0; i < creds.length; i += 1) {
    data[creds[i].slug] = creds[i].value;
  }

  // Use any encryption method
  const encryptedSecret = EncryptHelper.encrypt(
    encryptionKey,
    JSON.stringify(data)
  );

  await Secret.create({
    app_id: appId,
    company_id: companyId,
    secrets: encryptedSecret,
  });

  const response = {
    success: true,
    app_id: req.params.app_id,
    is_active: true,
    data: creds,
  };
  res.status(200).json(response);
});

// @desc get merchant credentials
// @route GET /api/v1/secrets
// @access private
exports.getSecretsHandler = asyncHandler(async (req, res) => {
  const { app_id: appId } = req.params;
  const { company_id: companyId } = req.params;

  const encryptedSecret = await Secret.findOne({
    app_id: appId,
    company_id: companyId,
  });

  if (!encryptedSecret) {
    res.status(200).json({
      success: true,
      is_active: false,
      app_id: appId,
      data: CREDENTIAL_FIELDS,
    });
    return res;
  }

  let secrets = EncryptHelper.decrypt(encryptionKey, encryptedSecret.secrets);
  secrets = JSON.parse(secrets);

  const creds = [];
  for (let i = 0; i < CREDENTIAL_FIELDS.length; i += 1) {
    creds.push({
      slug: CREDENTIAL_FIELDS[i].slug,
      name: CREDENTIAL_FIELDS[i].name,
      required: CREDENTIAL_FIELDS[i].required,
      display: CREDENTIAL_FIELDS[i].display,
      tip: CREDENTIAL_FIELDS[i].tip,
      value: secrets[CREDENTIAL_FIELDS[i].slug],
    });
  }
  const responseData = {
    success: true,
    app_id: req.params.app_id,
    is_active: true,
    data: req.path.startsWith('/secrets') ? [] : creds,
  };
  res.status(200).json(responseData);
  return res;
});
