const Redis = require("ioredis");
const config = require("../config");

function connect(name, uri) {
  const db = new Redis(uri, {
    reconnectOnError: function (err) {
      console.error("Redis connection error:", err.message);
      // Return `true` to indicate whether reconnect should be attempted
      return true;
    },
  });
  db.on("connect", () => {
    console.log(`Redis ${name} connected.`);
  });
  db.on("ready", () => {
    console.log(`Redis ${name} is ready`);
  });
  db.on("error", () => {
    console.error(`Redis ${name} got error`);
  });
  db.on("close", () => {
    console.log(`Redis ${name} is closed`);
  });
  db.on("reconnecting", () => {
    console.log(`Redis ${name} got error`);
  });
  db.on("reconnecting", () => {
    console.log(`Redis ${name} is ended`);
  });
  return db;
}

const hostRedis = connect("Host Read Write", "localhost");

module.exports = { redisClient: hostRedis };
