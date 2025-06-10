import React, { useState, useEffect } from 'react';
import './style/home.css';
import MyFormComponent from '../components/MyFormComponent';
import Loader from '../components/Loader';
import MainService from '../services/main-service';
import { getApplication, getCompany } from '../helper/utils';

export default function Home() {
  const [pageLoading, setPageLoading] = useState(false);
  const [params, setParams] = useState([]);
  const [allApplications, setAllApplications] = useState([]);

  useEffect(() => {
    getCredentials();
  }, []);

  const getCredentials = async () => {
    setPageLoading(true);
    try {
      const appId = getApplication();
      const companyId = getCompany();
      const response = await MainService.getAllCredentialFields(
        appId,
        companyId
      );
      if (response && response.data) {
        setParams(response.data);
      } else {
        setParams([]);
      }
      setPageLoading(false);
    } catch (e) {
      console.error('Error fetching credentials:', e);
      setParams([]);
      setPageLoading(false);
    }
  };

  return <>{pageLoading ? <Loader /> : <MyFormComponent params={params} />}</>;
}
