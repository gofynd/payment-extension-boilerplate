const config = require('../config');
const newrelic =
  config.newrelic.app_name && config.newrelic.license_key
    ? require('newrelic')
    : null;

if (newrelic) {
  console.log('Loading newrelic npm package now');
} else {
  console.log('Newrelic configuration not found');
}
