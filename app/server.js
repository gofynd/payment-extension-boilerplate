const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const serveStatic = require("serve-static");
const { readFileSync } = require('fs');


const STATIC_PATH = process.env.NODE_ENV === 'production'
  ? path.join(process.cwd(), 'frontend', 'public', 'dist')
  : path.join(process.cwd(), 'frontend');

const { fdkExtension } = require('./fdk');
const errorHandler = require('./middleware/errorHandler');
const { extensionCredsRouter } = require('./routes/creds.router');
const { PaymentService } = require('./services/payment.service');
const { CredsService } = require('./services/creds.service');
const {
  initiatePaymentToPGHandler,
  getPaymentDetailsHandler,
  paymentCallbackHandler,
  createRefundHandler,
  getRefundDetailsHandler,
  processWebhook,
  processRefundWebhook,
} = require('./controllers/transaction.controller');
const {
  createSecretsHandler,
  checkPaymentReadinessHandler,
} = require('./controllers/credsController');

const app = express();

app.use(cookieParser('ext.session'));
app.use(
  bodyParser.json({
    limit: '2mb',
  })
);

app.use(bodyParser.urlencoded({ extended: false }));
// Serve static files from the React dist directory
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use('/', fdkExtension.fdkHandler);

// Initialize payment service with existing handlers
// These handlers are implemented in orderController.js and use AggregatorProcessor
// for payment gateway specific operations. Developers can replace these handlers
// with their own implementation if needed.
const paymentService = new PaymentService({
  initiatePaymentToPG: initiatePaymentToPGHandler,
  getPaymentDetails: getPaymentDetailsHandler,
  createRefund: createRefundHandler,
  getRefundDetails: getRefundDetailsHandler
});

// Initialize credentials service with existing handlers
const credsService = new CredsService({
  createSecrets: createSecretsHandler,
  checkPaymentReadiness: checkPaymentReadinessHandler
});

// Register service routes
paymentService.registerRoutes(app);
credsService.registerRoutes(app);

// Payment Gateway webhook routes
app.post('/api/v1/payment_callback/:company_id/:app_id', paymentCallbackHandler);
app.post('/api/v1/webhook/payment/:company_id/:app_id', processWebhook);
app.post('/api/v1/webhook/refund/:company_id/:app_id', processRefundWebhook);

// Routes mounted on platformApiRoutes will have fdkSession middleware attached to the request object,
// providing access to authenticated session data and platform context for secure API endpoints.
const { platformApiRoutes } = fdkExtension;

// These protected routes will be called by the extension UI
platformApiRoutes.use('/v1', extensionCredsRouter);
app.use('/protected', platformApiRoutes);

app.use(errorHandler);

// app.get('/company/:company_id/application/:app_id', (req, res) => {
//   res.contentType('text/html');
//   res.sendFile(path.join(STATIC_PATH, 'index.html'));
// });

app.get('*', (req, res) => {
  return res
  .status(200)
  .set("Content-Type", "text/html")
  .send(readFileSync(path.join(STATIC_PATH, "index.html")));
});

app.engine('html', require('ejs').renderFile);

app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

module.exports = app;
