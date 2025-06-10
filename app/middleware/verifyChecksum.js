const { AuthorizationError } = require("../common/customError");
const config = require("../config");
const { fdkExtension } = require("../fdk/index")
const { getHashChecksum, getHmacChecksum } = require("../utils/signatureUtils");

const verifyPlatformChecksum = (req, res, next) => {
    const request_payload = req.body;
    const checksum = getHmacChecksum(JSON.stringify(request_payload), config.extension.api_secret);
    if (checksum !== req.headers.checksum)
        throw new AuthorizationError("Invalid Checksum");
    next();
};

const verifyPGChecksum = (req, res, next) => {
    const request_payload = req.body;
    const checksum = getHmacChecksum(JSON.stringify(request_payload),
    config.extension.api_secret);
    if (checksum !== req.headers.checksum)
        throw new AuthorizationError("Invalid Checksum");
    next();
}

const verifyFrontendChecksum = (req, res, next) => {
    const checksum = getHashChecksum(
        config.extension.api_secret + "|" + req.params._id, config.extension.api_secret
    );
    if (checksum !== req.headers.checksum)
        throw new AuthorizationError("Invalid Checksum");
    next();
}

const verifyExtensionAuth = (req, res, next) => {
    const basic_auth = config.extension.api_secret;
    const basicAuthHeader = "Basic " + btoa(basic_auth);
    if (basicAuthHeader !== req.headers.authorization)
        throw new AuthorizationError("Authorization failed");
    next();
}

const verifyApplicationId = async (req, res, next) => {
    const applicationId = req.params.app_id;
    const companyId = req.headers['x-company-id'];

    try {
        let platformClient = await fdkExtension.getPlatformClient(companyId);
        const response = await platformClient.application(applicationId).configuration.getApplicationById();
        if (response.company_id == companyId) {
            next();
        }
        else {
            res.status(403).json({ error: 'Unauthorized' });
        }
    } catch (error) {
        res.status(403).json({ error: 'Unauthorized' });
    }
}

module.exports = {
    verifyPlatformChecksum,
    verifyPGChecksum,
    verifyFrontendChecksum,
    verifyExtensionAuth,
    verifyApplicationId
};
