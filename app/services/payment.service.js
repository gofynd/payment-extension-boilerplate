class PaymentService {
  constructor(handlers) {
    this.handlers = handlers;
  }

  registerRoutes(app) {
    // Order routes
    app.post('/api/v1/orders', this.handlers.createOrder);
    app.get('/api/v1/payments/:gid', this.handlers.getPaymentDetails);
    app.post('/api/v1/refunds', this.handlers.createRefund);
    app.get('/api/v1/refunds/:gid', this.handlers.getRefundDetails);
    
    // Callback and webhook routes
    app.post('/company/:company_id/application/:app_id/payment/callback', this.handlers.paymentCallback);
    app.post('/api/v1/webhooks/payment', this.handlers.processWebhook);
    app.post('/api/v1/webhooks/refund', this.handlers.processRefundWebhook);
  }
}

module.exports = { PaymentService }; 