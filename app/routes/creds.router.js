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

// called from platform
credsRouter.get('/secrets/:app_id', verifyExtensionAuth, getSecretsHandler);

// called from frontend
apiRouter.get(
  '/credentials/:company_id/:app_id',
  verifyApplicationId,
  getSecretsHandler
);
apiRouter.post(
  '/credentials/:company_id/:app_id',
  verifyApplicationId,
  createSecretsHandler
);

module.exports = {
  credsRouter: credsRouter,
  apiRouter: apiRouter,
};
