const { FDKBase } = require("homelander/fdk");
const config = require("../config");
const removeTrailingSlash = require("../utils/commonUtils");

const fdkExtensionConfig = {
    api_key: config.extension.api_key,
    api_secret: config.extension.api_secret,
    base_url: config.extension.base_url,
    callbacks: {
        auth: async (req) => {
            console.log(`Authorized extension for ${req.query['company_id']}`)
            return `${removeTrailingSlash(req.extension.base_url)}/company/${req.query['company_id']}/application/${req.query['application_id']}`;
        },

        uninstall: async (req) => {
            console.log(`Uninstalling extension for company: ${req.body?.company_id}`);
        }
    },
    access_mode: "offline",
    debug: true,
    redisStorage: config.extension_slug,
    cluster: config.extension.fp_api_server // this is optional (default: "https://api.fynd.com")
};

const fdkExtension = async () => {
    const fdkInstance = new FDKBase(fdkExtensionConfig);
    return await fdkInstance.initFDK();
}

module.exports = {
    fdkExtension
};