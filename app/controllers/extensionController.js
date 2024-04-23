const asyncHandler = require("express-async-handler");
const { httpStatus } = require("../../constants");
const setupExtension = require("../extension/index");
const { extension } = require("../extension/extension");




exports.extensionInstallController = asyncHandler(async (req, res, next) => {
    response = extension.initialize(req.body);
    res.status(httpStatus.CREATED).json(response);
});

exports.extensionUninstallController = asyncHandler(async (req, res, next) => {
    response = extension.uninstallExtension(req.params.company_id);
    res.status(httpStatus.CREATED).json(response);
});

