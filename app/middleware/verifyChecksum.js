const { AuthorizationError } = require("../common/customError");
const config = require("../config");
const { getHmacChecksum } = require("../utils/signatureUtils");

const verifyPlatformChecksum = (req, res, next) => {
    const request_payload = req.body;

    const checksum = getHmacChecksum(JSON.stringify(request_payload), config.api_secret);

    if (checksum !== req.headers.checksum)
        throw new AuthorizationError("Invalid Checksum");
    next();
};

const verifyExtensionAuth = (req, res, next) => {
    const basicAuthHeader = "Basic " + btoa(config.api_secret);

    if (basicAuthHeader !== req.headers.authorization)
        throw new AuthorizationError("Authorization failed");
    next();
}

const verifyApplicationId = (req, res, next) => {
    const pathApplicationId = req.params.app_id;
    const headerApplicationId = req.headers['x-application-id'];
  
    if (pathApplicationId && headerApplicationId && pathApplicationId === headerApplicationId) {
      next();
    } else {
        throw new AuthorizationError("Authorization failed");
    }
}

const verifyStatusChecksum = (req, res, next) => {
    const gid = req.params.gid;

    const checksum = getHmacChecksum(gid, config.api_secret);

    if (checksum !== req.headers.checksum)
        throw new AuthorizationError("Invalid Checksum");
    next();
}

module.exports = {
    verifyPlatformChecksum,
    verifyExtensionAuth,
    verifyStatusChecksum,
    verifyApplicationId
};
