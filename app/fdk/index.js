const { setupFdk } = require("fdk-extension-javascript/express");
const { RedisStorage } = require("fdk-extension-javascript/express/storage");
const config =  require("../config");
const { redisClient } = require("./../common/redis.init");

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
        
        uninstall: async (req) => {
            // Write your code here to cleanup data related to extension
            // If task is time taking then process it async on other process.
            console.log(`Uninstalling extension for company: ${req.query('company_id')}`);
        }
    },
    debug: true,
    storage: new RedisStorage(redisClient, config.extension_slug), // add your prefix
    access_mode: "offline",
    cluster:  config.extension.fp_api_server // this is optional (default: "https://api.fynd.com")
});


module.exports = {
    fdkExtension
};
