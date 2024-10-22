const convict = require("convict");

let config = convict({
  env: {
    doc: "The application environment.",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV",
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
    default: "http://localhost:3000/",
    env: "EXTENSION_BASE_URL",
  },
  fp_api_server: {
    doc: "FP API Server",
    default: "https://api.fynd.com",
    env: "EXTENSION_CLUSTER_URL",
  },
  pgBaseUrl: {
    doc: "payment gateway base url",
    format: String,
    default: "/",
    env: "PG_BASE_URL"
  },
  port: {
    doc: 'The port this extension will bind to',
    format: 'port',
    default: 8081,
    env: 'PORT',
    arg: 'port',
  },
  extension_slug: {
    doc: "extension slug",
    default: "dummy",
    env: "",
  },
  encryption_key: {
    doc: "encryption key for saving credentials",
    default: "07385a56ad050fec6f145cd30cf32b345cf2d7e4006d8c5fb1dd7463a0834c47",
    env: "ENCRYPTION_KEY",
  }
});

config.validate({ allowed: 'strict' });

const configProperties = config.getProperties();

module.exports = configProperties;
