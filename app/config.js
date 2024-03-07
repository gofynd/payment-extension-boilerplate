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
    encrypt_secret: {
      doc: "encryption secret for credentials",
      default: "",
      env: "ENCRYPT_SECRET",
    },
    encrypt_iv: {
      doc: "encryption initialization vector",
      default: "",
      env: "ENCRYPT_IV",
    },
    platform_api_salt: {
      doc: "Fynd platform salt for checksum verification",
      default: "",
      env: "PLATFORM_API_SALT",
    },
    base_url: {
      doc: "extension base_url",
      default: "https://8a8e-14-142-187-98.ngrok-free.app",
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
      env: '',
      arg: '',
    },
    TTL: {
      doc: "cache time to live",
      format: int,
      default: 5 * 60,
      env: '',
      arg: ''
    }
  },
  mongodb: {
    host: {
      uri: {
        doc: 'host mongodb',
        format: 'mongo-uri',
        default: 'mongodb://127.0.0.1:27017/db_name',
        env: '',
        arg: '',
      },
    },
  },
  port: {
    doc: 'The port this extension will bind to',
    format: 'port',
    default: 8081,
    env: 'PORT',
    arg: 'port',
  },
  extension_slug: {
    doc: "Extension slug",
    format: String,
    default: "<paymentgateway>",
    env: "",
    arg: "",
  },
  global_ttl: {
    doc: "Global Redis Keys TTL",
    format: Number,
    default: 60 * 60 * 24 * 180,  // 180 days
    env: "GLOBAL_TTL",
    arg: "global_ttl",
  },
  pg_checksum_secret: {
    doc: 'pg secret from fynd platform',
    format: String,
    default: 'pg_checksum_secret',
    env: 'PG_CHECKSUM_SECRET',
    arg: 'pg_checksum_secret',
  },
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
