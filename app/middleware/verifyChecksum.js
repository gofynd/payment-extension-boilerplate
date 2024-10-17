const { httpStatus } = require("../../constants");
const { AuthorizationError } = require("../common/customError");
const config = require("../config");
const { getHashChecksum, getHmacChecksum } = require("../utils/signatureUtils");

const verifyGringottsChecksum = (req, res, next) => {
    const request_payload = req.body;
    const checksum = getHmacChecksum(JSON.stringify(request_payload), config.extension.gringotts_api_salt);
    if (checksum !== req.headers.checksum)
        throw new AuthorizationError("Invalid Checksum");
    next();
};

const verifyPGChecksum = (req, res, next) => {
    const request_payload = req.body;
    const checksum = getHmacChecksum(JSON.stringify(request_payload), process.env.CHECKOUT_CHECKSUM_SECRET);
    if (checksum !== req.headers.checksum) 
        throw new AuthorizationError("Invalid Checksum");
    next();
}

const verifyFrontendChecksum = (req, res, next) => {
    const checksum = getHashChecksum(
        config.extension.api_secret + "|" + req.params._id, config.extension.gringotts_api_salt
    );
    if (checksum !== req.headers.checksum) 
        throw new AuthorizationError("Invalid Checksum");
    next();
}

const verifyExtensionAuth = (req, res, next) => {
    const basic_auth = config.extension.gringotts_api_salt;
    const basicAuthHeader = "Basic " + btoa(basic_auth);
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
      res.status(403).json({ error: 'Invalid x-application-id' });
    }
}

const verifyStatusChecksum = (req, res, next) => {
    const checksum = getHmacChecksum(req.params.gid, config.extension.gringotts_api_salt);
    if (checksum !== req.headers.checksum)
        throw new AuthorizationError("Invalid Checksum");
    next();
}

module.exports = {
    verifyGringottsChecksum,
    verifyPGChecksum,
    verifyFrontendChecksum,
    verifyExtensionAuth,
    verifyStatusChecksum,
    verifyApplicationId
};
