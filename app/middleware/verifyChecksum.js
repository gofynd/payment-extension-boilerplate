const { httpStatus } = require("../../constants");
const { AuthorizationError } = require("../common/customError");
const config = require("../config");
const { generateToken } = require("../extension/extensionHelper");
// const { fdkExtension } = require("../fdk/index")
const { getHashChecksum, getHmacChecksum } = require("../utils/signatureUtils");
const { version } = require('../../package.json');
const { AxiosHelper } = require("../common/axiosHelper");

const verifyPlatformChecksum = (req, res, next) => {
    const request_payload = req.body;
    const checksum = getHmacChecksum(JSON.stringify(request_payload), config.extension.platform_api_salt);
    if (checksum !== req.headers.checksum)
        throw new AuthorizationError("Invalid Checksum");
    next();
};

const verifyPGChecksum = (req, res, next) => {
    const request_payload = req.body;
    const checksum = getHmacChecksum(JSON.stringify(request_payload),
    config.extension.platform_api_salt);
    if (checksum !== req.headers.checksum)
        throw new AuthorizationError("Invalid Checksum");
    next();
}

const verifyFrontendChecksum = (req, res, next) => {
    const checksum = getHashChecksum(
        config.extension.api_secret + "|" + req.params._id, config.extension.platform_api_salt
    );
    if (checksum !== req.headers.checksum)
        throw new AuthorizationError("Invalid Checksum");
    next();
}

const verifyExtensionAuth = (req, res, next) => {
    const basic_auth = config.extension.platform_api_salt;
    const basicAuthHeader = "Basic " + btoa(basic_auth);
    if (basicAuthHeader !== req.headers.authorization)
        throw new AuthorizationError("Authorization failed");
    next();
}

const verifyApplicationId = async (req, res, next) => {
    const applicationId = req.params.app_id;
    const companyId = req.headers['x-company-id'] || req.params.company_id;

    try {
        // TODO: Remove the fdk call use API call instead, API is giving unauthorized response for now.
        // let platformClient = await fdkExtension.getPlatformClient(companyId);
        // const response = await platformClient.application(applicationId).configuration.getApplicationById();
        const token = generateToken(config.extension.api_key, config.extension.api_secret);
        const rawRequest = {
            method: "get",
            url: `${config.extension.fp_api_server}/service/platform/configuration/v1.0/company/${companyId}/application/${req.headers['x-application-id']}`,
            headers: {
                Authorization: `Basic ${token}`,
                "Content-Type": "application/json",
                'x-ext-lib-version': `js/${version}`
            },
            params: {}
        };
        let response = await AxiosHelper.request(rawRequest);
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
