const asyncHandler = require('express-async-handler');
const config = require('../config');
const { Secret } = require('../models/model');
const EncryptHelper = require('../utils/encryptUtils');

const { encryption_key: encryptionKey } = config;

const CREDENTIAL_FIELDS = [
  { name: 'API Key', slug: 'api_key', required: true, display: true },
];

/**
 * @desc Create merchant credentials
 * @route POST /api/v1/secrets
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} req.params - Parameters from the URL
 * @param {string} req.params.app_id - Application ID
 * @param {string} req.params.company_id - Company ID
 * @param {Object} req.body - Request body
 * @param {Array} req.body.data - Array of credentials data
 * @param {Object} res - Express response object
 */
exports.createSecretsHandler = asyncHandler(async (req, res) => {
  const { app_id: appId } = req.params;

  // Validate required parameters
  if (!appId || !companyId) {
    return res
      .status(400)
      .json({ success: false, message: 'Missing app_id or company_id' });
  }

  const creds = req.body.data;

  // Validate creds data
  if (!Array.isArray(creds) || creds.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid or empty credentials array' });
  }

  // Prepare data object
  const data = {};
  creds.forEach(cred => {
    if (cred.slug && cred.value) {
      data[cred.slug] = cred.value;
    }
  });

  // Encrypt the credentials
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    return res
      .status(500)
      .json({ success: false, message: 'Encryption key not configured' });
  }

  const encryptedSecret = EncryptHelper.encrypt(
    encryptionKey,
    JSON.stringify(data)
  );

  // Save or update the encrypted secrets in the database
  await Secret.findOneAndUpdate(
    { app_id: appId, company_id: companyId }, // Filter
    { secrets: encryptedSecret }, // Update
    { upsert: true, new: true } // Options
  );

  // Construct response
  const response = {
    success: true,
    app_id: appId,
    is_active: true,
    message: 'Secrets successfully updated',
  };

  res.status(200).json(response);
});

/**
 * @desc Get merchant credentials
 * @route GET /api/v1/secrets
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} req.params - Parameters from the URL
 * @param {string} req.params.app_id - Application ID
 * @param {string} req.params.company_id - Company ID
 * @param {Object} res - Express response object
 */
exports.getSecretsHandler = asyncHandler(async (req, res) => {
  const { app_id: appId, company_id: companyId } = req.params;

  // Fetch encrypted secrets from the database
  const encryptedSecret = await Secret.findOne({
    app_id: appId,
  });

  // If no secrets are found, return default credential fields
  if (!encryptedSecret) {
    res.status(200).json({
      success: true,
      is_active: false,
      app_id: appId,
      data: CREDENTIAL_FIELDS,
    });
    return res;
  }

  // Decrypt the secrets and construct the response
  let secrets = EncryptHelper.decrypt(encryptionKey, encryptedSecret.secrets);
  secrets = JSON.parse(secrets);

  const creds = CREDENTIAL_FIELDS.map(field => ({
    ...field,
    value: secrets[field.slug],
  }));

  const responseData = {
    success: true,
    app_id: appId,
    is_active: true,
    data: req.path.startsWith('/secrets') ? [] : creds,
  };
  res.status(200).json(responseData);
  return res;
});
