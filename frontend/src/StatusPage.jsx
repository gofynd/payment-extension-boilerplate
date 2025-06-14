import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import './App.css';

function StatusPage() {
  const { company_id: companyId } = useParams();
  const [searchParams] = useSearchParams();
  const appId = searchParams.get('application_id');
  const gid = searchParams.get('gid');
  // Function to call extension webhook directly
  const callExtensionWebhook = async (status) => {
    try {
      // This calls the extension webhook directly with the payment status
      const response = await fetch(`${window.location.origin}/api/v1/payment_callback/${companyId}/${appId}?gid=${gid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status,
          timestamp: new Date().toISOString(),
          transaction_id: `txn_${Date.now()}`, // Generate a unique transaction ID
          amount: 100.00,
          currency: 'INR',
          payment_details: [{
            payment_id: `txn_${Date.now()}`,
            mode: 'live',
            aggregator_order_id: `txn_${Date.now()}`,
            amount: 10000, // Amount in paise
            currency: 'INR',
            status: status === 'PAYMENT_COMPLETE' ? 'complete' : 'failed',
            created: new Date().toISOString()
          }],
          checksum: 'dummy_checksum' // In production, this should be properly generated
        }),
      });
      return response.json();
    } catch (error) {
      console.error('Error calling extension webhook:', error);
      throw error;
    }
  };

  const handleSuccess = async () => {
    try {
      // Call extension webhook directly with success status
      const webhookResponse = await callExtensionWebhook('PAYMENT_COMPLETE');
      console.log('Extension Webhook Response:', webhookResponse);
      console.log('Payment status updated to success');
    } catch (error) {
      console.error('Error in payment process:', error);
    }
  };

  const handleFailure = async () => {
    try {
      // Call extension webhook directly with failure status
      const webhookResponse = await callExtensionWebhook('PAYMENT_FAILED');
      console.log('Extension Webhook Response:', webhookResponse);
      console.log('Payment status updated to failure');
    } catch (error) {
      console.error('Error in payment process:', error);
    }
  };

  return (
    <div className="form-container">
      <h1>Payment Status</h1>
      
      <div className="note-box">
        <p>
          <strong>Payment Status Page</strong> Click the buttons below to simulate different payment states.
        </p>
      </div>
      
      <div className="form-actions">
        <button 
          onClick={handleSuccess}
          className="submit-button"
          style={{ marginRight: '10px' }}
        >
          Success
        </button>
        <button 
          onClick={handleFailure}
          className="submit-button"
          style={{ backgroundColor: '#dc3545' }}
        >
          Failure
        </button>
      </div>
    </div>
  );
}

export default StatusPage; 