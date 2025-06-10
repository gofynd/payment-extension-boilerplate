require('dotenv').config();
const { DEFAULT_CONFIG, AGGREGATOR_CONFIG } = require('./constants');

const config = {
    env: process.env.NODE_ENV,
    log_level: process.env.LOG_LEVEL,
    extension: {
        aggregator_slug: process.env.AGGREGATOR_SLUG,
        api_key: process.env.EXTENSION_API_KEY,
        api_secret: process.env.EXTENSION_API_SECRET,
        base_url: process.env.EXTENSION_BASE_URL,
        fp_api_server: process.env.EXTENSION_CLUSTER_URL || DEFAULT_CONFIG.FP_API_SERVER
    },
    redis: {
        host: process.env.REDIS_HOST
    },
    mongodb: {
        host: {
            uri: process.env.MONGO_HOST_URI
        }
    },
    port: parseInt(process.env.PORT, 10),
    extension_slug: process.env.EXTENSION_SLUG,
    global_ttl: parseInt(process.env.GLOBAL_TTL || DEFAULT_CONFIG.GLOBAL_TTL, 10)
};

// Validate environment
if (!['production', 'development', 'test'].includes(config.env)) {
    throw new Error(`Invalid NODE_ENV: ${config.env}`);
}

module.exports = config;
