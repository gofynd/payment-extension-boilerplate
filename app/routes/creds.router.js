const express = require('express');
const {
  verifyExtensionAuth,
  verifyApplicationId,
} = require('../middleware/verifyChecksum');

const credsRouter = express.Router();
const apiRouter = express.Router();

const {
  createSecretsHandler,
  getSecretsHandler,
} = require('../controllers/credsController');

/**
 * @route GET /secrets/:app_id
 * @desc Fetch merchant secrets by app ID
 * @access Private (requires extension authentication)
 */
credsRouter.get('/secrets/:app_id', verifyExtensionAuth, getSecretsHandler);

/**
 * @route POST /secrets
 * @desc Create merchant secrets
 * @access Private (requires extension authentication)
 * @desc - This api is being called by platform to confirm the activation of extension
 */
credsRouter.post('/secrets', verifyExtensionAuth, createSecretsHandler);

/**
 * @route GET /credentials/:company_id/:app_id
 * @desc Fetch merchant credentials by company ID and app ID
 * @access Private (requires application ID verification)
 */
apiRouter.get(
  '/credentials/:company_id/:app_id',
  verifyApplicationId,
  getSecretsHandler
);

/**
 * @route POST /credentials/:company_id/:app_id
 * @desc Create merchant credentials by company ID and app ID
 * @access Private (requires application ID verification)
 */
apiRouter.post(
  '/credentials/:company_id/:app_id',
  verifyApplicationId,
  createSecretsHandler
);

module.exports = {
  credsRouter,
  apiRouter,
};
