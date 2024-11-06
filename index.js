require('dotenv').config();
const config = require('./app/config');
const app = require('./app/server');
require('./app/common/newrelic');

const port = config.port || 3000;

app.listen(port, () => {
  console.log(`Example app listening at port:${port}`);
});
