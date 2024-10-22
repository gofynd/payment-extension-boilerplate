require("dotenv").config();
const config = require("./app/config");
const app = require("./app/server");

const port = config.port || 3000;

app.listen(port, () => {
  console.log(`Example app listening at port:${port}`);
});