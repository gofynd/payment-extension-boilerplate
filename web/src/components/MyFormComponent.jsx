// Create a React component
import React, { useState } from 'react';
import { getApplication, getCompany } from '../helper/utils';
import MainService from '../services/main-service';
import './MyFormComponent.css';
import MessageBox from './MessageBox';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';

const MyFormComponent = ({ params }) => {
  const initialFormData = params.reduce((acc, param) => {
    acc[param.slug] = param.value || '';
    return acc;
  }, {});

  const [formData, setFormData] = useState(initialFormData);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [hidden, setHidden] = useState(true);

  const handleInputChange = e => {
    const { id, value } = e.target;
    setFormData(formData => ({ ...formData, [id]: value }));
  };

  const createBody = formData => {
    var body = [];
    for (var key in formData) {
      body.push({
        slug: key,
        value: formData[key],
      });
    }
    return body;
  };

  const hideField = () => {
    setHidden(!hidden);
  };

  const handleClick = () => {
    setShowSuccessBanner(true);
    setTimeout(() => {
      setShowSuccessBanner(false);
    }, 1500);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    handleClick();

    const body = createBody(formData);
    try {
      const response = await MainService.submitCredentials(
        getApplication(),
        getCompany(),
        { data: body }
      );

      if (response.status === 201) {
        setShowSuccessBanner(true);

        setTimeout(() => {
          setShowSuccessBanner(false);
        }, 3000);
      } else {
        console.error('Failed to make POST request');
      }
    } catch (error) {
      console.error('Error during POST request:', error);
    }
  };

  return (
    <div id="root">
      <h1>Credentials</h1>
      <form method="post" onSubmit={handleSubmit}>
        {params.map((param, index) => (
          <>
            {param.display != false && (
              <div key={index}>
                <label htmlFor={param.name}>
                  {param.name}
                  {param.required && <>*</>}
                </label>
                <br />
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    id={param.slug}
                    required={param.required}
                    name={param.name}
                    // value={hidden === false ? formData[param.slug] : Array(formData[param.slug].length).fill('*').join('')}
                    value={formData[param.slug]}
                    type={hidden === false ? 'text' : 'password'}
                    onChange={handleInputChange}
                    style={{ marginRight: '8px' }} // Adjust the margin as needed
                  />
                  {hidden === false ? (
                    <FaRegEye
                      size={25}
                      style={{ marginBottom: '8px' }}
                      onClick={hideField}
                    />
                  ) : (
                    <FaRegEyeSlash
                      size={25}
                      style={{ marginBottom: '8px' }}
                      onClick={hideField}
                    />
                  )}
                </div>
                <br />
              </div>
            )}
          </>
        ))}
        <input type="submit" value="Submit" />
      </form>
      {showSuccessBanner && <MessageBox />}
    </div>
  );
};

export default MyFormComponent;
