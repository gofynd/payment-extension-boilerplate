const asyncHandler = require("express-async-handler");
const { httpStatus } = require("../../constants");
const config =  require("../config");
const { startAuthorization, getAuthCallback } = require("../extension/extensionHelper");
const Session = require("../extension/session");
const { SESSION_COOKIE_NAME } = require("../extension/constants");
const { v4: uuidv4 } = require("uuid");
const SessionStorage = require("../extension/sessionStorage");
const { getExtensionInstanceHandler } = require("../extension/extension");
const { logger } = require("../common/logger");

exports.extensionInstallController = asyncHandler(async (req, res, next) => {
    let ext = getExtensionInstanceHandler();
    {
        // ?company_id=1&client_id=123313112122
        try {
            let companyId = parseInt(req.query.company_id);
            // let platformConfig = ext.getPlatformConfig(companyId);
            let session;

            session = new Session(Session.generateSessionId(true));

            let sessionExpires = new Date(Date.now() + 900000); // 15 min

            if (session.isNew) {
                session.company_id = companyId;
                session.scope = ext.scopes;
                session.expires = sessionExpires;
                session.access_mode = 'online'; // Always generate online mode token for extension launch
                session.extension_id = ext.api_key;
            } else {
                if (session.expires) {
                    session.expires = new Date(session.expires);
                }
            }

            req.fdkSession = session;
            req.extension = ext;

            const compCookieName = `${SESSION_COOKIE_NAME}_${companyId}`
            res.header['x-company-id'] = companyId;
            res.cookie(compCookieName, session.id, {
                secure: true,
                httpOnly: true,
                expires: session.expires,
                signed: true,
                sameSite: "None"
            });

            let redirectUrl;

            session.state = uuidv4();

            // pass application id if received
            let authCallback = getAuthCallback(config.extension.base_url);
            if (req.query.application_id) {
                authCallback += "?application_id=" + req.query.application_id;
            }

            // start authorization flow 
            redirectUrl = startAuthorization({
                scope: session.scope,
                redirectUri: authCallback,
                state: session.state,
                access_mode: 'online' // Always generate online mode token for extension launch
            });
            await SessionStorage.saveSession(session);
            logger.debug(`Redirecting after install callback to url: ${redirectUrl}`);
            res.redirect(redirectUrl);
        } catch (error) {
            next(error);
        }
    }
    res.status(httpStatus.CREATED).json({"success": true});
});
