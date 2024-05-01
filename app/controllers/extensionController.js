const asyncHandler = require("express-async-handler");
const { httpStatus } = require("../../constants");
const config =  require("../config");
const { startAuthorization, getAuthCallback } = require("../extension/extensionHelper");
const Session = require("../extension/session");
const { SESSION_COOKIE_NAME } = require("../extension/constants");
const { v4: uuidv4 } = require("uuid");
const SessionStorage = require("../extension/sessionStorage");
const { getExtensionInstanceHandler, configData } = require("../extension/extension");
const logger = require("../common/logger")
const { SessionNotFoundError, InvalidOAuthError } = require("../extension/error_codes");
const OAuthClient = require("../extension/oauthClient");

const extensionInstallController = asyncHandler(async (req, res, next) => {
        // ?company_id=1&client_id=123313112122
        try {
            let ext = config.ext;
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

            req.extSession = session;
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
                access_mode: 'online', // Always generate online mode token for extension launch
                companyId: companyId
            });
            await SessionStorage.saveSession(session);
            logger.info(`Redirecting after install callback to url: ${redirectUrl}`);
            res.redirect(redirectUrl);
        } catch (error) {
            next(error);
        }
    // res.status(httpStatus.CREATED).json({"success": true});
});

const extensionAuthController = asyncHandler(async (req, res, next) => {
    try {
        if (!req.extSession) {
            throw new SessionNotFoundError("Can not complete oauth process as session not found");
        }

        if (req.extSession.state !== req.query.state) {
            throw new InvalidOAuthError("Invalid oauth call");
        }
        const companyId = req.extSession.company_id

        // const platformConfig = ext.getPlatformConfig(req.extSession.company_id);
        const oauthConfig = {companyId: companyId, domain: config.domain || "https://api.fynd.com", apiKey: config.extension.api_key, apiSecret: config.extension.api_secret};
        const oauthClient = new OAuthClient(oauthConfig);
        await oauthClient.verifyCallback(req.query);

        let token = oauthClient.raw_token;
        let sessionExpires = new Date(Date.now() + token.expires_in * 1000);

        req.extSession.expires = sessionExpires;
        token.access_token_validity = sessionExpires.getTime();
        req.extSession.updateToken(token);

        await SessionStorage.saveSession(req.extSession);

        // Generate separate access token for offline mode
        if (!ext.isOnlineAccessMode()) {

            let sid = Session.generateSessionId(false, {
                cluster: ext.cluster,
                companyId: companyId
            });
            let session = await SessionStorage.getSession(sid);
            if (!session) {
                session = new Session(sid);
            } else if (session.extension_id !== ext.api_key) {
                session = new Session(sid);
            }

            let offlineTokenRes = await oauthClient.getOfflineAccessToken(ext.scopes, req.query.code);

            session.company_id = companyId;
            session.scope = ext.scopes;
            session.state = req.extSession.state;
            session.extension_id = ext.api_key;
            offlineTokenRes.access_token_validity = platformConfig.oauthClient.token_expires_at;
            offlineTokenRes.access_mode = 'offline';
            session.updateToken(offlineTokenRes);

            await SessionStorage.saveSession(session);

        }

        const compCookieName = `${SESSION_COOKIE_NAME}_${companyId}`
        res.cookie(compCookieName, req.extSession.id, {
            secure: true,
            httpOnly: true,
            expires: sessionExpires,
            signed: true,
            sameSite: "None"
        });
        res.header['x-company-id'] = companyId;
        req.extension = ext;
        if (ext.webhookRegistry.isInitialized && ext.webhookRegistry.isSubscribeOnInstall) {
            const client = await ext.getPlatformClient(companyId, req.extSession);
            await ext.webhookRegistry.syncEvents(client, null, true).catch((err) => {
                logger.error(err);
            });
        }
        let redirectUrl = await ext.callbacks.auth(req);
        logger.debug(`Redirecting after auth callback to url: ${redirectUrl}`);
        res.redirect(redirectUrl);
    } catch (error) {
        logger.error(error);
        next(error);
    }
});

const extensionUninstallController = asyncHandler(async (req, res, next) => {
    try {
        let { company_id } = req.body;
        let sid;
        if (!ext.isOnlineAccessMode()) {
            sid = Session.generateSessionId(false, {
                cluster: ext.cluster,
                companyId: company_id
            });
            await SessionStorage.deleteSession(sid);
        }
        req.extension = ext;
        await ext.callbacks.uninstall(req);
        res.json({ success: true });
    } catch (error) {
        logger.error(error);
        next(error);
    }
});

module.exports = {
    extensionInstallController: extensionInstallController,
    extensionAuthController: extensionAuthController,
    extensionUninstallController: extensionUninstallController
}