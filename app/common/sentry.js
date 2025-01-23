const Sentry = require('@sentry/node');

const _ = require('lodash');
const packageJson = require('../../package.json');
const config = require('../config');

Sentry.init({
  dsn: config.sentry.dsn,
  release: packageJson.version,
  environment: process.env.ENV,
  enabled: !_.isEmpty(config.sentry.dsn),
});

module.exports = Sentry;
