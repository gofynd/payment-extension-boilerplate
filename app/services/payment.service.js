const {
  verifyPlatformChecksum,
  verifyStatusChecksum,
} = require('../middleware/verifyChecksum');

class PaymentService {
  constructor(handlers) {
    this.handlers = {
      initiatePaymentToPG: handlers.initiatePaymentToPG,
      getPaymentDetails: handlers.getPaymentDetails,
      createRefund: handlers.createRefund,
      getRefundDetails: handlers.getRefundDetails
    };
  }

  registerRoutes(app) {
    // Payment session routes
    app.post('/api/v1/payment_session/:gid', verifyPlatformChecksum, this.handlers.initiatePaymentToPG);
    app.get('/api/v1/payment_session/:gid', verifyStatusChecksum, this.handlers.getPaymentDetails);
    app.post('/api/v1/payment_session/:gid/refund', verifyPlatformChecksum, this.handlers.createRefund);
    app.get('/api/v1/payment_session/:gid/refund', verifyStatusChecksum, this.handlers.getRefundDetails);
  }
}

module.exports = { PaymentService }; 