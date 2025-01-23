import URLS from './endpoint.service';
import axios from 'axios';
import { getCompany, getApplication } from '../helper/utils';

axios.interceptors.request.use(config => {
  config.headers['x-company-id'] = getCompany();
  config.headers['x-application-id'] = getApplication();
  return config;
});

const MainService = {
  async getAllApplications(params = {}) {
    const res = await axios.get(await URLS.GET_ALL_APPLICATIONS());
    return res;
  },
  async getAllCredentialFields(app_id, company_id, params = {}) {
    const res = await axios.get(await URLS.GET_CREDENTIALS(app_id, company_id));
    return res;
  },
  async submitCredentials(app_id, company_id, body, params = {}) {
    const res = await axios.post(
      await URLS.POST_CREDENTIALS(app_id, company_id),
      body
    );
    return res;
  },
};

export default MainService;
