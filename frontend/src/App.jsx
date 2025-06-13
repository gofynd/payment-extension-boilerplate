import React, { useState, useEffect } from 'react';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import './App.css';

// Utility functions
const getCompany = () => window.location.pathname.split('/')[2];
const getApplication = () => window.location.pathname.split('/')[4];

// API endpoints
const getCredentialsUrl = (companyId, appId) => 
  `${window.location.protocol}//${window.location.hostname}:${window.location.port}/protected/v1/credentials/${companyId}/${appId}`;

// Main App Component
function App() {
  const [formData, setFormData] = useState({});
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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
debugger;
      if (response.json().success === true) {
        setShowSuccessBanner(true);
        setTimeout(() => setShowSuccessBanner(false), 3000);
      }
    } catch (error) {
      console.error('Error submitting credentials:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="form-container">
      <h1>Credentials</h1>
      <form onSubmit={handleSubmit} noValidate>
        {params.map((param) => (
          param.display !== false && (
            <div key={param.slug} className="form-field">
              <label htmlFor={param.slug}>
                {param.name}
                {param.required && <span className="required">*</span>}
              </label>
              <div className="input-group">
                <input
                  id={param.slug}
                  required={param.required}
                  name={param.name}
                  value={formData[param.slug]}
                  type={isPasswordVisible ? 'text' : 'password'}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  disabled={isSubmitting}
                >
                  {isPasswordVisible ? <FaRegEye size={20} /> : <FaRegEyeSlash size={20} />}
                </button>
              </div>
            </div>
          )
        ))}
        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? 'Submitting..' : 'Submit'}
        </button>
      </form>
      {showSuccessBanner && (
        <div className="message-box">
          Updated Successfully
        </div>
      )}
    </div>
  );
}

export default App;
