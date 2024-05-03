const config = require("../config");
const urljoin = require('url-join');
// const { Logger } = require("../common/logger")
const querystring = require("query-string");
const { sign } = require("../common/requestSigner");
const { OAuthCodeError } = require("./error_codes");
const logger = require("../common/logger");

function startAuthorization(options) {
    // Logger({ level: "INFO", message: "Starting Authorization..." });
    logger.info("Starting Authorization...");
    let domain =  config.domain || "https://api.fynd.com"
    const query = {
        client_id: config.apiKey || config.extension.api_key,
        scope: options.scope,
        redirect_uri: options.redirectUri,
        state: options.state,
        access_mode: options.access_mode,
        response_type: "code",
    };
    const queryString = querystring.stringify(query);
    const companyId = config.companyId || options.companyId

    const reqPath = `/service/panel/authentication/v1.0/company/${companyId}/oauth/authorize?${queryString}`;
    const signingOptions = {
        method: "GET",
        host: new URL(domain).host,
        path: reqPath,
        body: null,
        headers: {},
    };
    const signature = sign(signingOptions, {
        signQuery: true,
    });
    // Logger({ level: "INFO", message: "Authorization successful.!" });
    logger.info("Authorization successful.!", { level: "info" });
    const urlObj = new URL(reqPath, domain);
    urlObj.searchParams.set("x-fp-date", signature["x-fp-date"] || signature.headers["x-fp-date"]);
    urlObj.searchParams.set("x-fp-signature", signature["x-fp-signature"] || signature.headers["x-fp-signature"]);

    return urlObj.href;
}

async function renewAccessToken(isOfflineToken = false) {
  try {
    // Logger({ level: "INFO", message: "Renewing Access token..." });
    logger.info("Renewing Access token...");
    let res;
    if (isOfflineToken) {
      let requestCacheKey = `${this.config.apiKey}:${this.config.companyId}`;
      if (!refreshTokenRequestCache[requestCacheKey]) {
        refreshTokenRequestCache[requestCacheKey] = await getAccesstokenObj({
          grant_type: "refresh_token",
          refresh_token: this.refreshToken,
        });
      }
      res = await refreshTokenRequestCache[requestCacheKey].finally(() => {
        delete refreshTokenRequestCache[requestCacheKey];
      });
    } else {
      res = await getAccesstokenObj({
        grant_type: "refresh_token",
        refresh_token: this.refreshToken,
      });
    }
    this.setToken(res);
    this.token_expires_at =
      new Date().getTime() + this.token_expires_in * 1000;
    Logger({ level: "INFO", message: "Done." });
    return res;
  } catch (error) {
    if (error.isAxiosError) {
      throw new FDKTokenIssueError(error.message);
    }
    throw error;
  }
}

function getAuthCallback(base_url) {
    return urljoin(base_url, "/fp/auth");
}

async function getAccessToken() {
    if (
      !this.useAutoRenewTimer &&
      this.refreshToken &&
      this.isTokenExpired(120)
    ) {
      // Check if token is about to expire in less than 2 mins.
      // Renew if to be expired and auto renew timer is not enabled.
      await this.renewAccessToken();
    }
    return this.token;
  }

async function verifyCallback(query) {
    if (query.error) {
      throw new OAuthCodeError(query.error_description, {
        error: query.error,
      });
    }
  
    try {
      let res = await getAccessToken({
        grant_type: "authorization_code",
        code: query.code,
      });
      setToken(res);
      token_expires_at = new Date().getTime() + token_expires_in * 1000;
    } catch (error) {
      if (error.isAxiosError) {
        throw new FDKTokenIssueError(error.message);
      }
      throw error;
    }
  }
  
function generateToken(apiKey, apiSecret) {
    const token = Buffer.from(`${apiKey}:${apiSecret}`, "utf8").toString("base64");
    return token;
}

module.exports = {
    startAuthorization: startAuthorization,
    getAuthCallback: getAuthCallback,
    verifyCallback: verifyCallback,
    generateToken: generateToken,
};
