const convict = require("convict");
const mongodbUri = require('mongodb-uri');

convict.addFormat({
  name: 'mongo-uri',
  validate: function (val) {
    let parsed = mongodbUri.parse(val);
    mongodbUri.format(parsed);
  },
  coerce: function (urlString) {
    if (urlString) {
      let parsed = mongodbUri.parse(urlString);
      urlString = mongodbUri.format(parsed);
    }
    return urlString;
  },
});

let config = convict({
  env: {
    doc: "The application environment.",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV",
  },
  log_level: {
    doc: "log level",
    format: String,
    default: "info",
    env: "LOG_LEVEL",
  },
  extension: {
    aggregator_slug: {
      doc: "aggregator slug",
      default: "aggregator_slug",
      env: "AGGREGATOR_SLUG",
    },
    api_key: {
      doc: "extension api key",
      default: "",
      env: "EXTENSION_API_KEY",
    },
    api_secret: {
      doc: "extension api secret",
      default: "",
      env: "EXTENSION_API_SECRET",
    },
    base_url: {
      doc: "extension base_url",
      default: "",
      env: "EXTENSION_BASE_URL",
    },
    fp_api_server: {
      doc: "FP API Server",
      default: "https://api.fynd.com",
      env: "EXTENSION_CLUSTER_URL",
    }
  },
  redis: {
    host: {
      doc: 'Redis URL of host.',
      format: String,
      default: 'redis://127.0.0.1:6379/0',
      env: 'REDIS_HOST'
    }
  },
  mongodb: {
    host: {
      uri: {
        doc: 'host mongodb',
        format: 'mongo-uri',
        default: 'mongodb://127.0.0.1:27017/db_name',
        env: 'MONGO_HOST_URI',
      },
    },
  },
  port: {
    doc: 'The port this extension will bind to',
    format: 'port',
    default: 8081,
    env: 'PORT'
  },
  extension_slug: {
    doc: "Extension slug",
    format: String,
    default: "paymentgateway",
    env: "EXTENSION_SLUG"
  },
  global_ttl: {
    doc: "Global Redis Keys TTL",
    format: Number,
    default: 60 * 60 * 24 * 180,  // 180 days
    env: "GLOBAL_TTL"
  }
});

// Perform validation
config.validate({ allowed: "strict" });
config = config.get();

exports.aggregatorConfig = {
    'createOrder': '/initiate/payment/request',
    'refund': '/initiate-refund',
    'orderStatus': '/v1/payment/status',
    'resendPayment': '/rposasp/resend/paymentlink',
    'refundStatus': '/v2/refund-status',
};

module.exports = config;
