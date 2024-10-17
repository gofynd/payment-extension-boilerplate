import URLS from "./endpoint.service";
import axios from "axios";
import { getCompany, getApplication } from "../helper/utils";

axios.interceptors.request.use((config) => {
  config.headers["x-company-id"] = getCompany();
  config.headers["x-application-id"] = getApplication();
  return config;
});

const MainService = {
  getAllApplications(params = {}) {
    return axios.get(URLS.GET_ALL_APPLICATIONS());
  },
  getAllCredentialFields(app_id, params = {}) {
    return axios.get(URLS.GET_CREDENTIALS(app_id));
  },
  submitCredentials(app_id, body, params = {}) {
    return axios.post(URLS.POST_CREDENTIALS(app_id), body);
  },
};

export default MainService;
