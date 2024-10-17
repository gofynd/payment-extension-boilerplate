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
    default: "64e596c9eb9c8c8a3a1ed389",
    env: "EXTENSION_API_KEY",
  },
  api_secret: {
    doc: "extension api secret",
    default: "oX6Pgf9BykBH1zy",
    env: "EXTENSION_API_SECRET",
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
  }
});

config = config.get();

module.exports = config;
