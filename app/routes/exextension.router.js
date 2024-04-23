const express = require('express');
const { extensionInstallController } = require('../controllers/extensionController');
const extensionRouter = express.Router();



extensionRouter.post('/install', extensionInstallController);


module.exports = extensionRouter;
