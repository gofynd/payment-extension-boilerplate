require('dotenv').config();
const { DEFAULT_CONFIG } = require('./constants');

const config = {
  env: process.env.NODE_ENV || DEFAULT_CONFIG.ENV,
  api_key: process.env.EXTENSION_API_KEY || '',
  api_secret: process.env.EXTENSION_API_SECRET || '',
  base_url: process.env.EXTENSION_BASE_URL || DEFAULT_CONFIG.BASE_URL,
  fp_api_server: process.env.EXTENSION_CLUSTER_URL || DEFAULT_CONFIG.FP_API_SERVER,
  port: parseInt(process.env.BACKEND_PORT),
  encryption_key: process.env.EXTENSION_API_SECRET || '',
  mongodb: {
    host: {
      uri: process.env.MONGO_URI || DEFAULT_CONFIG.MONGO_URI
    }
  }
};

module.exports = config;
