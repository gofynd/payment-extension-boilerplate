/**
 * DEVELOPMENT ONLY: In-memory storage implementation
 * 
 * TODO: Before production deployment:
 * - Replace with persistent database (MongoDB/PostgreSQL)
 * - Data is currently lost on server restart
 * - Not suitable for production use
 */

const { fdkExtension } = require('../fdk');

const PaymentModel = {
  // Store payment payload
  storePayment: async (gid, payload) => {
    try {
      if (!fdkExtension) {
        throw new Error('FDK extension is not initialized');
      }
      
      if (!fdkExtension.extension.storage) {
        throw new Error('FDK storage is not initialized');
      }

      await fdkExtension.extension.storage.set(`payment:${gid}`, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error('Error storing payment:', error);
      throw error;
    }
  },

  // Get payment payload by gid
  getPayment: async (gid) => {
    try {
      if (!fdkExtension) {
        throw new Error('FDK extension is not initialized');
      }
      
      if (!fdkExtension.extension.storage) {
        throw new Error('FDK storage is not initialized');
      }

      const paymentData = await fdkExtension.extension.storage.get(`payment:${gid}`);
      return paymentData ? JSON.parse(paymentData) : null;
    } catch (error) {
      console.error('Error getting payment:', error);
      throw error;
    }
  }
};

module.exports = PaymentModel; 