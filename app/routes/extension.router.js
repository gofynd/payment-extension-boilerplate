const express = require('express');
const { extensionInstallController } = require('../controllers/extensionController');
const extensionRoutes = express.Router();


extensionRoutes.post('/fp/install', extensionInstallController);

module.exports = extensionRoutes;