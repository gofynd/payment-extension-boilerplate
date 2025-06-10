import URLS from './endpoint.service';
import { getCompany, getApplication } from '../helper/utils';

// Custom fetch wrapper to handle headers
const customFetch = async (url, options = {}) => {
  const headers = {
    'x-company-id': getCompany(),
    'x-application-id': getApplication(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

const MainService = {
  async getAllApplications(params = {}) {
    const res = await customFetch(await URLS.GET_ALL_APPLICATIONS());
    return res;
  },
  async getAllCredentialFields(app_id, company_id, params = {}) {
    const res = await customFetch(await URLS.GET_CREDENTIALS(app_id, company_id));
    return res;
  },
  async submitCredentials(app_id, company_id, body, params = {}) {
    const res = await customFetch(
      await URLS.POST_CREDENTIALS(app_id, company_id),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
    return res;
  },
};

export default MainService;
