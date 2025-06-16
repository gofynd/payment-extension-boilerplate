const { fdkExtension } = require('../fdk');
const PaymentModel = require('../models/payment.model');

// Environment variables
const EXTENSION_BASE_URL = process.env.EXTENSION_BASE_URL;

// Payment mode constant
const PAYMENT_MODE = 'live'; // Can be 'live' or 'test'

// Payment status constants
const paymentStatus = {
  COMPLETE: 'complete',
  PENDING: 'pending',
  FAILED: 'failed'
};

// Refund status constants
const refundStatus = {
  INITIATED: 'initiated',
  COMPLETE: 'complete',
  FAILED: 'failed'
};

/**
 * Creates a new payment order and initiates payment gateway integration
 * 
 * For detailed request/response schema, refer to:
 * @https://docs.fynd.com/partners/commerce/extension/payments-doc/api/payments-post-api
 * 
 * Request Payload Format:
 * {
 *   customer_name: string,
 *   customer_email: string,
 *   app_id: string,
 *   company_id: string,
 *   customer_contact: string,
 *   gid: string,
 *   amount: number,
 *   currency: string,
 *   success_url: string,
 *   cancel_url: string,
 *   billing_address: object,
 *   shipping_address: object,
 *   payment_methods: array,
 *   ...other fields
 * }
 * 
 * Expected Response Format:
 * {
 *   gid: string,
 *   redirect_url: string,
 *   success: boolean
 * }
 */
exports.initiatePaymentToPGHandler = async (req, res, next) => {
  try {
    const requestPayload = req.body;
    console.log('LOG: Payload received from platform', requestPayload);
    const { gid } = requestPayload;

    // Store the payment payload in SQLite
    await PaymentModel.storePayment(gid, requestPayload);

    // Step 1: Prepare customer data for payment gateway
    const customerData = {
      customer_name: requestPayload.customer_name,
      customer_contact: requestPayload.customer_contact,
      customer_email: requestPayload.customer_email,
    };

    // Step 2: Prepare callback URL for payment gateway webhook
    const callbackUrl = `${EXTENSION_BASE_URL}/api/v1/callback/${requestPayload.company_id}/${requestPayload.app_id}`;

    // Step 3: Prepare payment gateway request payload
    /*
     * Payment gateway payload structure can vary based on the payment gateway implementation.
     * Below is a sample structure - modify according to your payment gateway requirements:
     * 
     * const paymentGatewayPayload = {
     *   amount: requestPayload.amount,
     *   currency: requestPayload.currency,
     *   transactionReferenceId: requestPayload.gid,
     *   customer: customerData,
     *   callbackUrl,
     *   address: requestPayload.billing_address,
     *   // Add any additional fields required by your payment gateway
     *   // Example: payment_methods, metadata, etc.
     * };
     */

    // Step 4: Call payment gateway API to create order
    /**
     * TODO: Replace mock implementation with actual payment gateway integration
     * - Implement real payment gateway API calls
     * - Add proper error handling
     * - Add payment gateway specific configurations
     * - Add proper logging and monitoring
     */
    // const paymentGatewayResponse = await axios.post('https://your-payment-gateway.com/api/v1/orders', paymentGatewayPayload, {
    //   headers: {
    //     'Authorization': `Bearer ${config.payment_gateway_api_key}`,
    //     'Content-Type': 'application/json'
    //   }
    // });

    // Step 5: Handle payment gateway response
    /**
     * TODO: Replace mock response with actual payment gateway response handling
     * - Implement proper response validation
     * - Add error handling for different response scenarios
     * - Add proper logging
     */
    const paymentGatewayResponse = {
      status: 200,
      data: {
        payment_url: `${EXTENSION_BASE_URL}/company/${requestPayload.company_id}/status?application_id=${requestPayload.app_id}&gid=${gid}`,
      },
    };

    // Step 6: Prepare response for Fynd Platform
    const platformResponse = {
      success: true,
      redirect_url: paymentGatewayResponse.data.payment_url,
      gid,
    };
    console.log('LOG: Response for create payment', platformResponse);
    
    res.status(200).json(platformResponse);
  } catch (error) {
    // Handle specific payment gateway errors
    if (error.response?.data) {
      console.error('Payment Gateway Error:', error.response.data);
      return res.status(400).json({
        success: false,
        gid: req.body.gid,
        error: error.response.data.message || 'Payment gateway error occurred'
      });
    }
    next(error);
  }
};

exports.createRefundHandler = async (req, res, next) => {
  try {
    const requestPayload = req.body;
    console.log('LOG: Request body for create refund', requestPayload);

    const {
      aggregator_payment_id: forwardPaymentId,
      gid,
      requestId,
      amount,
      currency,
    } = requestPayload;

    const orderIdCombined = `${gid}-${requestId}`;
    const payload = {
      amount: {
        value: amount / 100,
        currency_code: currency,
      },
      invoice_id: orderIdCombined,
    };

    // In real implementation, make API call to payment gateway
    // For demo, returning mock response
    const response = {
      status: 200,
      data: {
        refund_utr: "ICIC2098423058020",
        refund_id: "890342354509842",
      }
    };

    let refundResponse;
    if (response.status === 200) {
      refundResponse = {
        status: refundStatus.INITIATED,
        refundUtr: response.data.refund_utr,
        paymentId: response.data.refund_id,
      };
    } else {
      refundResponse = {
        status: refundStatus.FAILED,
      };
    }

    const responseData = {
      gid,
      aggregator_payment_refund_details: {
        status: refundResponse.status,
        amount,
        currency,
        requestId,
        refundUtr: refundResponse.refundUtr,
        paymentId: refundResponse.paymentId,
      },
    };
    console.log('LOG: Response for create refund', responseData);
    
    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

exports.getPaymentDetailsHandler = async (req, res, next) => {
  try {
    const { gid } = req.params;
    console.log('LOG: Request for get payment details', { gid });
    
    if (!gid) {
      throw new Error('Payment session ID is required');
    }

    // In real implementation, fetch from payment gateway
    // For demo, returning mock response
    const response = {
      status: 200,
      data: {
        payment_status: "PAYMENT_COMPLETE",
        currency: "INR",
        amount: "100.00",
        transaction_id: "20230404011640000850068625351118848",
      }
    };

    let amount, status, paymentId;
    if (response.status === 200) {
      if (response.data.payment_status === 'PAYMENT_COMPLETE') {
        status = paymentStatus.COMPLETE;
        paymentId = response.data.transaction_id;
        amount = response.data.amount;
      } else if (response.data.payment_status === 'PAYMENT_PENDING') {
        status = paymentStatus.PENDING;
        paymentId = response.data.transaction_id;
        amount = response.data.amount;
      } else {
        status = paymentStatus.FAILED;
      }
    }

    const amountInPaise = amount * 100;
    const responseData = {
      gid,
      order_details: {
        gid,
        amount: amountInPaise,
        status,
        currency: response.data.currency,
        aggregator_order_details: response.data,
        aggregator: 'Dummy',
      },
      status,
      currency: response.data.currency,
      total_amount: amountInPaise,
      payment_details: [
        {
          gid,
          amount: amountInPaise,
          currency: response.data.currency,
          payment_id: paymentId,
          mode: PAYMENT_MODE,
          success_url: '',
          cancel_url: '',
          amount_captured: amountInPaise,
          payment_methods: [{}],
          g_user_id: '<User id if exists>',
          aggregator_order_id: paymentId,
          status,
          created: String(Date.now()),
        },
      ],
    };

    console.log('Response for get Payment Details', responseData);
    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

exports.getRefundDetailsHandler = async (req, res, next) => {
  try {
    const { gid } = req.params;
    console.log('LOG: Request for get refund details', { gid });
    
    if (!gid) {
      throw new Error('Refund session ID is required');
    }

    // In real implementation, fetch from payment gateway
    // For demo, returning mock response
    const response = {
      status: 200,
      data: {
        refund_status: "REFUND_COMPLETE",
        currency: "INR",
        amount: "100.00",
        transaction_id: "20230404011640000850068625351118848",
        refund_utr: "ICICI0982435028943"
      }
    };

    let amount, status, paymentId, refundUtr;
    if (response.status === 200) {
      if (response.data.refund_status === 'REFUND_COMPLETE') {
        status = refundStatus.COMPLETE;
        paymentId = response.data.transaction_id;
        amount = response.data.amount;
        refundUtr = response.data.refund_utr;
      } else if (response.data.refund_status === 'REFUND_PENDING') {
        status = refundStatus.PENDING;
        paymentId = response.data.transaction_id;
        amount = response.data.amount;
      } else {
        status = refundStatus.FAILED;
      }
    }

    const amountInPaise = amount * 100;
    const responseData = {
      gid,
      status,
      currency: response.data.currency,
      total_amount: amountInPaise,
      refund_details: [
        {
          status,
          payment_id: paymentId,
          refund_utr: refundUtr,
          amount: amountInPaise,
          currency: response.data.currency,
          created: String(Date.now()),
        },
      ],
      payment_details: {
        gid,
        status,
        aggregator_order_id: paymentId,
        payment_id: paymentId,
        mode: PAYMENT_MODE,
        amount: amountInPaise,
        success_url: '',
        cancel_url: '',
        amount_captured: amountInPaise,
        payment_methods: [{}],
        g_user_id: '<User id if exists>',
        currency: response.data.currency,
        amount_refunded: amountInPaise,
        created: String(Date.now()),
      },
      meta: response.data,
    };

    console.log('Response for get Refund Details', responseData);
    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
}; 