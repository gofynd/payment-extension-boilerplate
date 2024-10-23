const config =  require("../config");
const { setupFdk } = require("fdk-extension-javascript/express");
const MongoStorage = require("./mongoStorage");

let fdkExtension = setupFdk({
    api_key: config.api_key,
    api_secret: config.api_secret,
    base_url: config.base_url,
    callbacks: {
        auth: async (req) => {
            // Write you code here to return initial launch url after suth process complete
            return `${req.extension.base_url}/company/${req.query['company_id']}/application/${req.query['application_id']}`;
        },
        uninstall: async (req) => {
            // Any clean up activity here
            console.log("Uninstalling extension")
        }
    },
    debug: false,
    storage: new MongoStorage(),
    access_mode: "offline",
    cluster: config.fp_api_server
});


module.exports = {
    fdkExtension
};