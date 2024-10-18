import urlJoin from "url-join";
import root from "window-or-global";
let envVars = root.env || {};

// envVars.EXAMPLE_MAIN_URL = `${root.location.protocol}//${root.location.hostname}`;
envVars.EXAMPLE_MAIN_URL = `${root.location.protocol}//${root.location.hostname}:${root.location.port}`;
if (
  root &&
  root.process &&
  root.process.env &&
  root.process.NODE_ENV === "test"
) {
  envVars.EXAMPLE_MAIN_URL = "https://rational-gently-kit.ngrok-free.app";
}

const Endpoints = {
  GET_ALL_APPLICATIONS() {
    return urlJoin(envVars.EXAMPLE_MAIN_URL, "/api/v1.0/applications");
  },
  GET_CREDENTIALS(app_id, company_id) {
    return urlJoin(
      envVars.EXAMPLE_MAIN_URL,
      "/protected/v1/credentials/",
      company_id, "/", app_id
    );
  },
  POST_CREDENTIALS(app_id, company_id) {
    return urlJoin(
      envVars.EXAMPLE_MAIN_URL,
      "/protected/v1/credentials/",
      company_id, "/", app_id
    );
  },
};

export default Endpoints;
