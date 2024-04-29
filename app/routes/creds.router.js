const express = require('express');
const config = require("../config");
const { verifyExtensionAuth, verifyApplicationId } = require('../middleware/verifyChecksum')


const credsRouter = express.Router();
const apiRouter = express.Router();

const {
    createSecretsHandler,
    getSecretsHandler,
    createStatusMapperHandler,
    getStatusMapperHandler,
    updateStatusMapperHandler,
    deleteStatusMapperHandler,
} = require("../controllers/credsController")


credsRouter.post('/secrets', verifyExtensionAuth, createSecretsHandler);
credsRouter.get('/secrets/:app_id', verifyExtensionAuth, getSecretsHandler);

apiRouter.get('/credentials/:app_id', verifyApplicationId, getSecretsHandler);
apiRouter.post('/credentials/:app_id', verifyApplicationId, createSecretsHandler);

credsRouter.get('/status_mapper', verifyExtensionAuth, getStatusMapperHandler);
credsRouter.post('/status_mapper', verifyExtensionAuth, createStatusMapperHandler);
credsRouter.patch('/status_mapper', verifyExtensionAuth, updateStatusMapperHandler);
credsRouter.delete('/status_mapper', verifyExtensionAuth, deleteStatusMapperHandler)

module.exports = {
    credsRouter: credsRouter,
    apiRouter: apiRouter
}

