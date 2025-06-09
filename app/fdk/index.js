const { setupFdk } = require("@gofynd/fdk-extension-javascript/express");
const { RedisStorage } = require("@gofynd/fdk-extension-javascript/express/storage");
const config =  require("../config");
const { redisClient } = require("./../common/redis.init");
const { deleteCredentialsHandler } = require('./../controllers/credsController');

let fdkExtension = setupFdk({
    api_key: config.extension.api_key,
    api_secret: config.extension.api_secret,
    base_url: config.extension.base_url,
    callbacks: {
        auth: async (req) => {
            // Writee you code here to return initial launch url after suth process complete
            console.log(`Authorized extension for ${req.query['company_id']}`)
            console.log(req.extension.base_url);
            return `${req.extension.base_url}/company/${req.query['company_id']}/application/${req.query['application_id']}`;
        },
        
        uninstall: deleteCredentialsHandler
    },
    debug: true,
    storage: new RedisStorage(redisClient, config.extension_slug),
    access_mode: "offline",
    cluster:  config.extension.fp_api_server // this is optional (default: "https://api.fynd.com")
});


module.exports = {
    fdkExtension
};
