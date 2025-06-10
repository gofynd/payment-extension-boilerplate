const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');

const { fdkExtension } = require('./fdk');
const errorHandler = require('./middleware/errorHandler');
const { apiRouter } = require('./routes/creds.router');
const { PaymentService } = require('./services/payment.service');
const { CredsService } = require('./services/creds.service');
const {
  createOrderHandler,
  getPaymentDetailsHandler,
  paymentCallbackHandler,
  createRefundHandler,
  getRefundDetailsHandler,
  processWebhook,
  processRefundWebhook,
} = require('./controllers/orderController');
const {
  createSecretsHandler,
  getSecretsHandler,
} = require('./controllers/credsController');

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

// Initialize payment service with existing handlers
// These handlers are implemented in orderController.js and use AggregatorProcessor
// for payment gateway specific operations. Developers can replace these handlers
// with their own implementation if needed.
const paymentService = new PaymentService({
  createOrder: createOrderHandler,
  getPaymentDetails: getPaymentDetailsHandler,
  paymentCallback: paymentCallbackHandler,
  createRefund: createRefundHandler,
  getRefundDetails: getRefundDetailsHandler,
  processWebhook: processWebhook,
  processRefundWebhook: processRefundWebhook
});

// Initialize credentials service with existing handlers
const credsService = new CredsService({
  createSecrets: createSecretsHandler,
  getSecrets: getSecretsHandler
});

// Register service routes
paymentService.registerRoutes(app);
credsService.registerRoutes(app);

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
