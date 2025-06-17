import React, { useState, useEffect } from 'react';
import { FaRegEye, FaRegEyeSlash, FaInfoCircle } from 'react-icons/fa';
import { useParams, useSearchParams } from 'react-router-dom';
import './App.css';

// API endpoints
const getCredentialsUrl = (appId, companyId) => 
  `${window.location.origin}/protected/v1/company/${companyId}/credentials/${appId}`;

// Main App Component
function App() {
  const [searchParams] = useSearchParams();
  const { company_id: companyId } = useParams();
  const [formData, setFormData] = useState({});
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [params, setParams] = useState([]);
  const [error, setError] = useState(null);

  const getApplication = () => {
    const appId = searchParams.get('application_id');
    if (!appId) {
      console.error('Application ID is missing from URL');
      return null;
    }
    return appId;
  };

  const getCompanyId = () => {
    if (!companyId) {
      console.error('Company ID is missing from URL');
      return null;
    }
    return companyId;
  };

  const getCommonHeaders = () => {
    const appId = getApplication();
    const companyId = getCompanyId();
    
    const headers = {
      'x-application-id': appId,
      'x-company-id': companyId,
      'content-type': 'application/json'
    };
    
    return headers;
  };

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const appId = getApplication();
        const companyId = getCompanyId();
        
        if (!appId || !companyId) {
          setError('Application ID or Company ID is missing from URL');
          setIsLoading(false);
          return;
        }

        const url = getCredentialsUrl(appId, companyId);
        console.log('Fetching credentials from:', url); // Debug log

        const response = await fetch(url, {
          headers: getCommonHeaders(),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        setParams(data?.data || []);
        setFormData(
          (data?.data || []).reduce((acc, param) => ({
            ...acc,
            [param.slug]: param.value || ''
          }), {})
        );
      } catch (error) {
        console.error('Error fetching credentials:', error);
        setError(error.message);
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
      const appId = getApplication();
      const companyId = getCompanyId();
      
      if (!appId || !companyId) {
        throw new Error('Application ID or Company ID is missing from URL');
      }

      const body = Object.entries(formData).map(([slug, value]) => ({
        slug,
        value
      }));

      const response = await fetch(getCredentialsUrl(appId, companyId), {
        method: 'POST',
        headers: getCommonHeaders(),
        body: JSON.stringify({ data: body }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success === true) {
        setShowSuccessBanner(true);
        setTimeout(() => setShowSuccessBanner(false), 3000);
      }
    } catch (error) {
      console.error('Error submitting credentials:', error);
      setError(error.message);
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

  if (error) {
    return (
      <div className="form-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
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
