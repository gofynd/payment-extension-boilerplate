const { setupFdk } = require('@gofynd/fdk-extension-javascript/express');
const config = require('../config');
const MongoStorage = require('./mongoStorage');

const fdkExtension = setupFdk({
  api_key: config.api_key,
  api_secret: config.api_secret,
  base_url: config.base_url,
  callbacks: {
    auth: async req => {
      const application_id = req.query.application_id;
      // Write you code here to return initial launch url after suth process complete
      return `${req.extension.base_url}/company/${req.query.company_id}/credentials?application_id=${application_id}`;
    },
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
