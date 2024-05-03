const querystring = require("query-string");
const { AxiosHelper } = require("../common/axiosHelper");
const { sign } = require("../common/requestSigner");
const { TokenIssueError, OAuthCodeError } = require("./error_codes");
// const { Logger } = require("../common/logger");
const { convertStringToBase64 } = require("../common/utils");
const logger = require("../common/logger");

const refreshTokenRequestCache = {};
class OAuthClient {
  constructor(config) {
    this.config = config;
    this.token = null;
    this.refreshToken = null;
    this.retryOAuthTokenTimer = null;
    this.raw_token = null;
    this.token_expires_in = null;
    this.token_expires_at = 0;
    this.useAutoRenewTimer =
      config.useAutoRenewTimer !== undefined ? config.useAutoRenewTimer : true;
  }

  getAccessToken() {
    if (
      !this.useAutoRenewTimer &&
      this.refreshToken &&
      this.isTokenExpired(120)
    ) {
      // Check if token is about to expire in less than 2 mins.
      // Renew if to be expired and auto renew timer is not enabled.
      this.renewAccessToken();
    }
    return this.token;
  }

  // default TTL checked 0 seconds
  isTokenExpired(ttl = 0) {
    const currentTimestamp = new Date().getTime();
    // Check if token is about to expire in less than 2 mins
    if ((this.token_expires_at - currentTimestamp) / 1000 < ttl) {
      return true;
    }
    return false;
  }

  setToken(token) {
    this.raw_token = token;
    this.token_expires_in = token.expires_in;
    this.token = token.access_token;
    this.refreshToken = token.refresh_token ? token.refresh_token : null;
    if (this.refreshToken && this.useAutoRenewTimer) {
      this.retryOAuthToken(token.expires_in);
    }
    // Logger({ level: "INFO", message: "Token set." });
    logger.info("Tokenset.");
  }

  retryOAuthToken(expires_in) {
    // Logger({ level: "INFO", message: "Retrying OAuth Token..." });
    logger.info("Retrying OAuth Token...");
    if (this.retryOAuthTokenTimer) {
      clearTimeout(this.retryOAuthTokenTimer);
    }
    if (expires_in > 60) {
      this.retryOAuthTokenTimer = setTimeout(() => {
        this.renewAccessToken();
      }, (expires_in - 60) * 1000);
    }
  }

  // startAuthorization(options) {
  //   // Logger({ level: "INFO", message: "Starting Authorization..." });
  //   logger.info("Starting Authorization...");
  //   let query = {
  //     client_id: this.config.apiKey,
  //     scope: options.scope.join(","),
  //     redirect_uri: options.redirectUri,
  //     state: options.state,
  //     access_mode: options.access_mode,
  //     response_type: "code",
  //   };
  //   const queryString = querystring.stringify(query);
  //   const companyId = options.companyId;

  //   let reqPath = `/service/panel/authentication/v1.0/company/${companyId}/oauth/authorize?${queryString}`;
  //   let signingOptions = {
  //     method: "GET",
  //     host: new URL(this.config.domain).host,
  //     path: reqPath,
  //     body: null,
  //     headers: {},
  //   };
  //   const signature = sign(signingOptions, {
  //     signQuery: true,
  //   });
  //   // Logger({ level: "INFO", message: "Authorization successful.!" });
  //   logger.info("Authorization successful.!");
  //   const urlObj = new URL(reqPath, this.config.domain);
  //   urlObj.searchParams.set("x-fp-date", signature["x-fp-date"] || signature.headers["x-fp-date"]);
  //   urlObj.searchParams.set("x-fp-signature", signature["x-fp-signature"] || signature.headers["x-fp-signature"]);

  //   return urlObj.href;
  // }

  startAuthorization(options) {
    // Logger({ type: "INFO", message: "Starting Authorization..." });
    let query = {
      client_id: this.config.apiKey,
      scope: options.scope.join(","),
      redirect_uri: options.redirectUri,
      state: options.state,
      access_mode: options.access_mode,
      response_type: "code",
    };
    const queryString = querystring.stringify(query);

    let reqPath = `/service/panel/authentication/v1.0/company/${this.config.companyId}/oauth/authorize?${queryString}`;
    let signingOptions = {
      method: "GET",
      host: new URL(this.config.domain).host,
      path: reqPath,
      body: null,
      headers: {},
      signQuery: true,
    };
    signingOptions = sign(signingOptions);
    // Logger({ type: "INFO", message: "Authorization successful.!" });

    return `${this.config.domain}${signingOptions.path}`;
  }

  async verifyCallback(query) {
    if (query.error) {
      throw new OAuthCodeError(query.error_description, {
        error: query.error,
      });
    }

    try {
      let res = await this.getAccesstokenObj({
        grant_type: "authorization_code",
        code: query.code,
      });
      this.setToken(res);
      this.token_expires_at =
        new Date().getTime() + this.token_expires_in * 1000;
    } catch (error) {
      if (error.isAxiosError) {
        throw new TokenIssueError(error.message);
      }
      throw error;
    }
  }

  async renewAccessToken(isOfflineToken = false) {
    try {
      // Logger({ level: "INFO", message: "Renewing Access token..." });
      logger.info("Renewing Access token...");
      let res;
      if (isOfflineToken) {
        let requestCacheKey = `${this.config.apiKey}:${this.config.companyId}`;
        if (!refreshTokenRequestCache[requestCacheKey]) {
          refreshTokenRequestCache[requestCacheKey] = this.getAccesstokenObj({
            grant_type: "refresh_token",
            refresh_token: this.refreshToken,
          });
        }
        res = await refreshTokenRequestCache[requestCacheKey].finally(() => {
          delete refreshTokenRequestCache[requestCacheKey];
        });
      } else {
        res = await this.getAccesstokenObj({
          grant_type: "refresh_token",
          refresh_token: this.refreshToken,
        });
      }
      this.setToken(res);
      this.token_expires_at =
        new Date().getTime() + this.token_expires_in * 1000;
      // Logger({ level: "INFO", message: "Done." });
      logger.info("Done")
      return res;
    } catch (error) {
      if (error.isAxiosError) {
        throw new TokenIssueError(error.message);
      }
      throw error;
    }
  }

  async getAccesstokenObj({ grant_type, refresh_token, code }) {
    // Logger({ level: "INFO", message: "Processing Access token object..." });
    logger.info("Processing Access token object...");
    let reqData = {
      grant_type: grant_type,
    };
    if (grant_type === "refresh_token") {
      reqData = { ...reqData, refresh_token };
    } else if (grant_type === "authorization_code") {
      reqData = { ...reqData, code };
    }

    const token = convertStringToBase64(
      `${this.config.apiKey}:${this.config.apiSecret}`
    );

    let url = `${this.config.domain}/service/panel/authentication/v1.0/company/${this.config.companyId}/oauth/token`;
    const rawRequest = {
      method: "post",
      url: url,
      data: querystring.stringify(reqData),
      headers: {
        Authorization: `Basic ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };
    // Logger({ level: "INFO", message: "Done." });
    logger.info("Done");
    return AxiosHelper.request(rawRequest);
  }

  async getOfflineAccessToken(scopes, code) {
    try {
      let res = await this.getOfflineAccessTokenObj(scopes, code);
      this.setToken(res);
      this.token_expires_at =
        new Date().getTime() + this.token_expires_in * 1000;
      return res;
    } catch (error) {
      if (error.isAxiosError) {
        throw new TokenIssueError(error.message);
      }
      throw error;
    }
  }

  async getOfflineAccessTokenObj(scopes, code) {
    let url = `${this.config.domain}/service/panel/authentication/v1.0/company/${this.config.companyId}/oauth/offline-token`;
    let data = {
      client_id: this.config.apiKey,
      client_secret: this.config.apiSecret,
      grant_type: "authorization_code",
      scope: scopes,
      code: code,
    };
    const token = convertStringToBase64(
      `${this.config.apiKey}:${this.config.apiSecret}`
    );
    const rawRequest = {
      method: "post",
      url: url,
      data: data,
      headers: {
        Authorization: `Basic ${token}`,
        "Content-Type": "application/json",
      },
    };
    return AxiosHelper.request(rawRequest);
  }
}

module.exports = OAuthClient;
