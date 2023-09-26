const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require("path");
const healthRouter = require("./routes/health.router");
const orderRouter = require("./routes/order.router");
const { fdkExtension } = require("./fdk");
const app = express();
const config = require("./config");
const errorHandler = require('./middleware/errorHandler');
const { httpStatus } = require("../constants");
const credsRouter = require('./routes/creds.router');

app.use(cookieParser("ext.session"));
app.use(bodyParser.json({
  limit: '2mb'
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/env.js', (req, res) => {
  const commonEnvs = {
    base_url: config.extension.base_url
  }
  res.type('application/javascript');
  res.send(
    `window.env = ${JSON.stringify(
      commonEnvs,
      null,
      4
    )}`
  );
});
app.use("/", healthRouter);
app.use(express.static(path.resolve(__dirname, "../public")));
app.use("/", fdkExtension.fdkHandler);

app.use('/api/v1', orderRouter);
app.use('/api/v1', credsRouter);
app.use(errorHandler);


app.get('/company/:company_id', (req, res) => {
  res.status(httpStatus.REDIRECT).redirect("https://www.example.com/");
})

app.get('*', (req, res) => {
    res.contentType('text/html');
    res.sendFile(path.resolve(__dirname, '../public/index.html'))
});

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

module.exports = app;