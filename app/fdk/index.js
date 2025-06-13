const { setupFdk } = require('@gofynd/fdk-extension-javascript/express');
const config = require('../config');
const MongoStorage = require('./mongoStorage');

const fdkExtension = setupFdk({
  api_key: config.api_key,
  api_secret: config.api_secret,
  base_url: config.base_url,
  callbacks: {
    auth: async req =>
      // Write you code here to return initial launch url after suth process complete
      `${req.extension.base_url}/credentials?application_id=${req.extension.application_id}`,
    uninstall: async () => {
      // Any clean up activity here
      console.log('Uninstalling extension');
    },
  },
  debug: false,
  storage: new MongoStorage(),
  access_mode: 'offline',
  cluster: config.fp_api_server,
});

module.exports = {
  fdkExtension,
};
