require('dotenv').config();
const app = require('./app/server');

const port = process.env.BACKEND_PORT || 3000;

app.listen(port, () => {
  console.log(`Example app listening at port:${port}`);
});
