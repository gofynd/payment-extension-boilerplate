import React, { useState, useEffect } from "react";

import "./style/home.css";
import MyFormComponent from "../components/MyFormComponent";
import Loader from "../components/Loader";
import { Input } from "@gofynd/nitrozen-react";
import MainService from "../services/main-service";
import { getApplication } from "../helper/utils";


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
      const { data } = await MainService.getAllCredentialFields(appId);
      setParams(data.data);
      setPageLoading(false);
    } catch (e) {
      setPageLoading(false);
    }
  };

  return (
    <>
      {pageLoading ? (
        <Loader />
      ) : (
        <MyFormComponent params={params} />
      )}
    </>
  );
}
