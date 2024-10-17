const express = require("express");

const { verifyExtensionAuth, verifyApplicationId } = require('../middleware/verifyChecksum')

const credsRouter = express.Router();
const apiRouter = express.Router();

const {
    createSecretsHandler,
    getSecretsHandler,
} = require("../controllers/credsController")


// TODO: check if frontend and backend are correct
// called from frontend
credsRouter.post('/secrets/:app_id', verifyExtensionAuth, createSecretsHandler);
credsRouter.get('/secrets/:app_id', verifyExtensionAuth, getSecretsHandler);

// called from platform
apiRouter.get('/credentials/:app_id', verifyApplicationId, getSecretsHandler);

module.exports = {
    credsRouter: credsRouter.getRouter(),
    apiRouter: apiRouter.getRouter()
}
