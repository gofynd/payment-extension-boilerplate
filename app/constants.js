/**
 * TODO: Development vs Production Configuration
 * 
 * These are development-only default configurations.
 * Before production deployment:
 * - Replace with environment-specific configurations
 * - Use secure production URLs
 * - Use production database URIs
 * - Remove hardcoded values
 */
const DEFAULT_CONFIG = {
  PORT: 8081,
  BASE_URL: 'http://localhost:3000/',
  FP_API_SERVER: 'https://api.fynd.com',
  MONGO_URI: 'mongodb://localhost:27017/example-payment-extension-javascript'
};

module.exports = {
  DEFAULT_CONFIG
}; 