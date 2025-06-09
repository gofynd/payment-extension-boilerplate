const axios = require('axios');
const logger = require('../common/logger');
const { redisClient } = require('../common/redis.init');
const config = require('../config');
const { AggregatorStatusMapper, Secret } = require('../models/models');
const EncryptHelper = require('./encryptUtils');

// for certificate issue Jay Check
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * Set data in Redis.
 * @param {string} key - The key to set the data for.
 * @param {string} value - The value to set.
 * @param {function} callback - The callback function to execute after setting the data. It takes an error argument if any.
 */
function setRedisData(key, value, expiry = config.global_ttl) {
    return new Promise((resolve, reject) => {
        redisClient.setex(key, expiry, value, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}


function getRedisData(key) {
    return new Promise((resolve, reject) => {
        redisClient.get(key, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}


function deleteKeyFromRedis(key) {
    return new Promise((resolve, reject) => {
        // Use the 'del' method to delete the specified key and its data
        redisClient.del(key, (err, reply) => {
            if (err) {
                reject(err);
            } else {
                resolve(reply); // 'reply' will be the number of keys deleted (0 or 1)
            }
        });
    });
}


async function getMerchantAggregatorConfig(kwargs) {
    const appId = kwargs['appId'];
    const refresh = kwargs['refresh'];

    const MERCHANT_AGGREGATOR_CONFIG = `${config.extension_slug}:MerchantAggregatorConfig:appId:${appId}`

    let secrets = {};
    if (refresh === false) {
        secrets = await getRedisData(MERCHANT_AGGREGATOR_CONFIG)
        if (secrets) {
            return JSON.parse(secrets)
        }
    }

    let secret = await Secret.findOne({ "app_id": appId });
    secrets = secret['secrets'];
    await setRedisData(MERCHANT_AGGREGATOR_CONFIG, JSON.stringify(secrets))

    return EncryptHelper.decrypt(config.extension.api_secret, secrets);
}


async function getAggregatorStatusMapper(aggregatorStatus, journeyType, refresh = false) {

    const AGGREGATOR_STATUS_MAPPER = `${config.extension_slug}:AggregatorStatusMapper:${journeyType}:${aggregatorStatus}`;

    let statusMapper = {};
    if (refresh === false) {
        statusMapper = await getRedisData(AGGREGATOR_STATUS_MAPPER);
        if (statusMapper && statusMapper != 'null') {
            return JSON.parse(statusMapper)
        }
    }

    statusMapper = await AggregatorStatusMapper.findOne({
        "aggregator_status": aggregatorStatus, "journey_type": journeyType
    });
    await setRedisData(AGGREGATOR_STATUS_MAPPER, JSON.stringify(statusMapper));
    // handle case status mapping not found
    if (!statusMapper) {
        logger.info(
            'Status mapping not found: %s, journeyType %s', aggregatorStatus, journeyType 
        );
        statusMapper = {
            status: aggregatorStatus,
            aggregator_status: aggregatorStatus,
            journey_type: journeyType
        };
    }
    return statusMapper;
}

async function clearCache(key) {
    // function to clear cache

    const reply = await deleteKeyFromRedis(key);
    if (reply === 1) {
        logger.info(`Key '${key}' and its data have been deleted from Redis.`);
    } else {
        logger.info(`Key '${key}' does not exist in Redis.`);
    }
}

// Generic function to make an HTTP request
async function makeRequest({ method, url, data, headers }) {
    try {
        const config = {
            method: method.toUpperCase(),
            url: url,
            data: data,
            headers: headers
        };
        logger.info("makeRequest Request: %O", JSON.stringify(config))
        try {
            const response = await axios(config);
            logger.info("makeRequest Response: %O", JSON.stringify({
                    httpStatus: response.status,
                    apiResponse: response.data
                })
            )
            return response;
          } catch (error) {
            if (error.response) {
              // Request made and server responded with a status code
              console.error('Response Status:', error.response.status);
              console.error('Response Data:', error.response.data);
            } else if (error.request) {
              // The request was made but no response was received
              console.error('No response received:', error.request);
            } else {
              // Something happened in setting up the request that triggered an Error
              console.error('Request Error:', error.message);
            }
            return error.message; // Re-throw the error to handle it at the caller level
          }
    } catch (error) {
        logger.error('makeRequest %s, error: %s, response: %O', url, error.message, error.response.data);
        error.code = error.response.status;
        throw error;
    }
}

function tryOr(fn, defaultValue) {
    /*
    Usage: tryOr(() => requestUser.email, null);
    */
    try {
        return fn();
    } catch (error) {
        return defaultValue;
    }
}


module.exports = {
    clearCache,
    getRedisData,
    setRedisData,
    getAggregatorStatusMapper,
    getMerchantAggregatorConfig,
    makeRequest,
    deleteKeyFromRedis,
    tryOr
}