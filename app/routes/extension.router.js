const express = require('express');
const { extensionInstallController, extensionAuthController } = require('../controllers/extensionController');
const { sessionMiddleware } = require('../middleware/middleware');

const extensionRoutes = express.Router();


extensionRoutes.get('/fp/install', extensionInstallController);
extensionRoutes.get('/fp/auth', sessionMiddleware(false), extensionAuthController);

module.exports = extensionRoutes;