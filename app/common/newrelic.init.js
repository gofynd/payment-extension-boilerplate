const config = require('../common/config');
const logger = require('../common/logger');
// // newrelic
if (config.newrelic.app_name && config.newrelic.license_key) {
  require('newrelic');
} else {
  logger.warn('Newrelic configuration not found');
}
