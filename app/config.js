const convict = require("convict");

let config = convict({
  env: {
    doc: "The application environment.",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV",
  },
  galaxy: {
    doc: "current environment",
    default: "fynd",
    env: "GALAXY",
  },
  log_level: {
    doc: "log level",
    format: String,
    default: "debug",
    env: "LOG_LEVEL",
  },
  extension: {
    aggregator_slug: {
      doc: "aggregator slug",
      default: "jioonepay",
      env: "AGGREGATOR_SLUG",
    },
    api_key: {
      doc: "extension api key",
      default: "64e596c9eb9c8c8a3a1ed389",
      env: "EXTENSION_API_KEY",
    },
    api_secret: {
      doc: "extension api secret",
      default: "oX6Pgf9BykBH1zy",
      env: "EXTENSION_API_SECRET",
    },
    encrypt_secret: {
      doc: "encryption secret for credentials",
      default: "NjQ4YzNiZDlkMjJmMDU0ZDUzZDkzYTdlMjZhOTgyY2RhMjQ2NmJhN2Q5MWY1N2U4NjVmNjQ3MDdjODYwMTA2OA==",
      env: "ENCRYPT_SECRET",
    },
    encrypt_iv: {
      doc: "encryption initialization vector",
      default: "ZjcwZWU5Y2MzZmRkNWE0ZDBmZGZmYmY5",
      env: "ENCRYPT_IV",
    },
    gringotts_api_salt: {
      doc: "salt for checksum verification",
      default: "SDSDSDSJDKSJDWOIWPIOEWDKLSDSLJDKLSDJSLKDJS",
      env: "GRINGOTTS_API_SALT",
    },
    base_url: {
      doc: "extension base_url",
      default: "https://68b5-14-142-187-98.ngrok-free.app",
      env: "EXTENSION_BASE_URL",
    },
    fp_api_server: {
      doc: "FP API Server",
      default: "https://api.fynd.com",
      env: "EXTENSION_CLUSTER_URL",
    }
  },
  pgBaseUrl: {
    doc: "payment gateway base url",
    format: String,
    default: "/",
    env: "PG_BASE_URL"
  },
  redis: {
    host: {
      doc: 'Redis URL of host.',
      format: String,
      default: 'redis://localhost:6379/0',
      env: 'REDIS_JIOONEPAY_READ_WRITE',
      arg: 'redis_jioonepay_read_write',
    },
  },
  mongodb: {
    host: {
      uri: {
        doc: 'host mongodb',
        format: 'mongo-uri',
        default: 'mongodb://127.0.0.1:27017/jioonepay',
        env: 'MONGO_JIOONEPAY_READ_WRITE',
        arg: 'mogno_jioonepay_read_write',
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
    doc: "JioOnePay Extension slug",
    format: String,
    default: "jioonepay",
    env: "EXTENSION_SLUG",
    arg: "extension_slug",
  },
  global_ttl: {
    doc: "Global Redis Keys TTL",
    format: Number,
    default: 60 * 60 * 24 * 180,  // 180 days
    env: "GLOBAL_TTL",
    arg: "global_ttl",
  },
  pg_checksum_secret: {
    doc: 'pg secret from gringotts',
    format: String,
    default: 'pg_checksum_secret',
    env: 'PG_CHECKSUM_SECRET',
    arg: 'pg_checksum_secret',
  },
  sentry: {
    dsn: {
      doc: "sentry dsn",
      format: String,
      default: "",
      env: "SENTRY_DSN",
      arg: "sentry_dsn"
    }
  },
  newrelic: {
    app_name: {
      doc: "newrelic app name",
      format: String,
      default: "",
      env: "NEW_RELIC_APP_NAME",
      arg: "new_relic_app_name"
    },
    licence_key: {
      doc: "newrelic license key",
      format: String,
      default: "",
      env: "NEW_RELIC_LICENSE_KEY",
      arg: "new_relic_license_key"
    }
  },
  sensitive_pii_fields: {
    doc: "sensitive pii fields which don't need to be logged",
    env: "SENSITIVE_PII_FIELDS",
    default: "customerName,customer_contact,customer_name,customer_email,phone,name,address,city,state,pincode,destination",
    arg: "sensitive_pii_fields"
  }
});

// Perform validation
config.validate({ allowed: "strict" });
config = config.get();

module.exports = config;
