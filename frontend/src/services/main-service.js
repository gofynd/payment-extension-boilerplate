import URLS from "./endpoint.service";
import { getCompany, getApplication } from "../helper/utils";

function withDefaultHeaders(options = {}) {
  const headers = {
    "x-company-id": getCompany(),
    "x-application-id": getApplication(),
    ...(options.headers || {})
  };
  return { ...options, headers };
}

async function fetchJson(url, options) {
  const response = await fetch(url, withDefaultHeaders(options));
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || response.statusText);
  }
  const jsonData = await response.json();
  return { data: jsonData };
}

const MainService = {
  getAllApplications(params = {}) {
    return fetchJson(URLS.GET_ALL_APPLICATIONS());
  },
  getAllCredentialFields(app_id, params = {}) {
    return fetchJson(URLS.GET_CREDENTIALS(app_id));
  },
  submitCredentials(app_id, body, params = {}) {
    return fetchJson(URLS.POST_CREDENTIALS(app_id), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  },
};

export default MainService;
