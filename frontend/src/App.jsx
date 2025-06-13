import React, { useState, useEffect } from 'react';
import { FaRegEye, FaRegEyeSlash, FaInfoCircle } from 'react-icons/fa';
import './App.css';

// Utility functions
const getCompany = () => new URLSearchParams(window.location.search).get('company_id');
const getApplication = () => new URLSearchParams(window.location.search).get('application_id');

// API endpoints
const getCredentialsUrl = (companyId, appId) => 
  `${window.location.protocol}//${window.location.hostname}:${window.location.port}/protected/v1/credentials/${companyId}/${appId}`;

// Main App Component
function App() {
  const [formData, setFormData] = useState({});
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [params, setParams] = useState([]);

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const response = await fetch(getCredentialsUrl(getCompany(), getApplication()), {
          headers: {
            'x-company-id': getCompany(),
            'x-application-id': getApplication(),
          },
        });
        const data = await response.json();
        setParams(data?.data || []);
        setFormData(
          (data?.data || []).reduce((acc, param) => ({
            ...acc,
            [param.slug]: param.value || ''
          }), {})
        );
      } catch (error) {
        console.error('Error fetching credentials:', error);
        setParams([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredentials();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const body = Object.entries(formData).map(([slug, value]) => ({
        slug,
        value
      }));

      const response = await fetch(getCredentialsUrl(getCompany(), getApplication()), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-company-id': getCompany(),
          'x-application-id': getApplication(),
        },
        body: JSON.stringify({ data: body }),
      });

      const data = await response.json();
      
      if (data.success === true) {
        setShowSuccessBanner(true);
        setTimeout(() => setShowSuccessBanner(false), 3000);
      }
    } catch (error) {
      console.error('Error submitting credentials:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (fieldId) => {
    setIsPasswordVisible(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

  const renderCredentialsSection = () => (
    <div className="section">
      <h2>API Credentials</h2>
      <p className="section-description">
        Configure your payment gateway API credentials below. These credentials are essential for authenticating and processing payments through your gateway. Make sure to use the correct credentials provided by your payment gateway provider.
      </p>
      {params.map((param) => (
        param.display !== false && (
          <div key={param.slug} className="form-field">
            <label htmlFor={param.slug}>
              {param.name}
              {param.required && <span className="required">*</span>}
              {param.description && (
                <span className="field-tooltip">
                  <FaInfoCircle />
                  <span className="tooltip-text">{param.description}</span>
                </span>
              )}
            </label>
            <div className="input-group">
              <input
                id={param.slug}
                required={param.required}
                name={param.name}
                value={formData[param.slug]}
                type={isPasswordVisible[param.slug] ? 'text' : 'password'}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder={param.placeholder || ''}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => togglePasswordVisibility(param.slug)}
                disabled={isSubmitting}
              >
                {isPasswordVisible[param.slug] ? <FaRegEye size={20} /> : <FaRegEyeSlash size={20} />}
              </button>
            </div>
          </div>
        )
      ))}
    </div>
  );

  if (isLoading) {
    return <div className="loading">Loading configuration...</div>;
  }

  return (
    <div className="form-container">
      <h1>Payment Gateway Configuration</h1>
      
      <div className="note-box">
        <p>
          <strong>Welcome to Payment Gateway Setup!</strong> This is a starter template that you need to customize to match your payment gateway's requirements. Feel free to modify the interface, add new fields, or adjust the styling to create the perfect integration for your needs.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} noValidate>
        {renderCredentialsSection()}
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>

      {showSuccessBanner && (
        <div className="message-box success">
          <span className="success-icon">✓</span>
          <span>Configuration saved successfully</span>
        </div>
      )}
    </div>
  );
}

export default App;
