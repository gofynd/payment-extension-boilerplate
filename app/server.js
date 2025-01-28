const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');

const { fdkExtension } = require('./fdk');
const errorHandler = require('./middleware/errorHandler');
const orderRouter = require('./routes/order.router');
const { credsRouter, apiRouter } = require('./routes/creds.router');

const app = express();

app.use(cookieParser('ext.session'));
app.use(
  bodyParser.json({
    limit: '2mb',
  })
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.resolve(__dirname, '../frontend/build/')));

app.use('/', fdkExtension.fdkHandler);
app.use('/api/v1', orderRouter);
app.use('/api/v1', credsRouter);

const { apiRoutes } = fdkExtension;
apiRoutes.use('/v1', apiRouter);
app.use('/protected', apiRoutes);

app.use(errorHandler);

app.get('/company/:company_id/application/:app_id', (req, res) => {
  res.contentType('text/html');
  res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'));
});

app.get('*', (req, res) => {
  res.contentType('text/html');
  res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'));
});

app.engine('html', require('ejs').renderFile);

app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

module.exports = app;
