const config = require("../config");
const urljoin = require('url-join');
const { Logger } = require("../common/logger")
const querystring = require("query-string");
const { sign } = require("../common/requestSigner");

function startAuthorization(options) {
    Logger({ level: "INFO", message: "Starting Authorization..." });
    let domain =  config.domain || "https://api.fynd.com"
    const query = {
        client_id: config.apiKey,
        scope: options.scope?.join(",") || '',
        redirect_uri: options.redirectUri,
        state: options.state,
        access_mode: options.access_mode,
        response_type: "code",
    };
    const queryString = querystring.stringify(query);

    const reqPath = `/service/panel/authentication/v1.0/company/${config.companyId}/oauth/authorize?${queryString}`;
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
    Logger({ level: "INFO", message: "Authorization successful.!" });
    const urlObj = new URL(reqPath, domain);
    urlObj.searchParams.set("x-fp-date", signature["x-fp-date"]);
    urlObj.searchParams.set("x-fp-signature", signature["x-fp-signature"]);

    return urlObj.href;
}


function getAuthCallback(base_url) {
    return urljoin(base_url, "/fp/auth");
}

module.exports = {
    startAuthorization: startAuthorization,
    getAuthCallback: getAuthCallback
};
