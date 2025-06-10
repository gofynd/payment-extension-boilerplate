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
const { credsRouter, apiRouter } = require('./routes/creds.router');
const fs = require('fs');

app.use(cookieParser("ext.session"));
app.use(bodyParser.json({
  limit: '2mb'
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/_healthz", healthRouter);

// Check if the frontend build directory exists
const buildPath = path.resolve(__dirname, "../frontend/build/");
if (!fs.existsSync(buildPath)) {
  console.error('Frontend build directory not found. Please run `npm run build` in the frontend directory.');
  process.exit(1);
}

app.use(express.static(buildPath));
app.use("/", fdkExtension.fdkHandler);

app.use('/api/v1', orderRouter);
app.use('/api/v1', credsRouter);
// app.use('/protected/v1', apiRouter); // uncomment these lines for local and comment below 3 lines

const platformApiRoutes = fdkExtension.platformApiRoutes; // comment
platformApiRoutes.use('/v1', apiRouter); // comment
app.use('/protected', platformApiRoutes); // comment

app.use(errorHandler);


app.get('/company/:company_id/application/:application_id', (req, res) => {
  res.contentType('text/html');
  res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'))
})

app.get('*', (req, res) => {
    res.contentType('text/html');
    res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'))
});

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

module.exports = app;