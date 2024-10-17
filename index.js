require("dotenv").config();
const config = require("./app/config");

async function startServer() {
  const app = require("./app/server");
  (async () => {
    handler = await app.initApp();
  })();
}

const init = async () => {
  startServer();
};

init();