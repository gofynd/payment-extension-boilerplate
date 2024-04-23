require("dotenv").config();
require("./app/common/redis.init");
require("./app/common/mongo.init");

const config = require("./app/config");
const app = require("./app/server");

const port = config.port || 3000;

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
