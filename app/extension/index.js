const { RedisStorage } = require("fdk-extension-javascript/express/storage");
const config =  require("../config");
const { redisClient } = require("../common/redis.init");
const { deleteCredentialsHandler } = require('./../controllers/credsController');

const congfiguration = {
    api_key: config.extension.api_key,
    api_secret: config.extension.api_secret,
    base_url: config.extension.base_url,
    callbacks: {
        auth: async (req) => {
            // Writee you code here to return initial launch url after suth process complete
            console.log(`Authorized extension for ${req.query['company_id']}`)
            console.log(req.extension.base_url);
            return `${req.extension.base_url}/company/${req.query['company_id']}/application/${req.query['application_id']}`;
        },
        
        uninstall: deleteCredentialsHandler
    },
    debug: true,
    storage: new RedisStorage(redisClient, config.extension_slug),
    access_mode: "offline",
    cluster:  config.extension.fp_api_server // this is optional (default: "https://api.fynd.com")
}


function setupExtension(data, syncInitialization) {
    if (data.debug) {
        logger.transports[0].level = 'debug';
    }
    const promiseInit = extension.initialize(data)
        .catch(err=>{
            logger.error(err);
            throw err;
        });
    let router = setupRoutes(extension);
    let { apiRoutes, applicationProxyRoutes } = setupProxyRoutes();

    async function getPlatformClient(companyId) {
        let client = null;
        if (!extension.isOnlineAccessMode()) {
            let sid = Session.generateSessionId(false, {
                cluster: extension.cluster,
                companyId: companyId
            });
            let session = await SessionStorage.getSession(sid);
            client = await extension.getPlatformClient(companyId, session);
        }
        return client;
    }

    async function getApplicationClient(applicationId, applicationToken) {
        let applicationConfig = new ApplicationConfig({
            applicationID: applicationId,
            applicationToken: applicationToken,
            domain: extension.cluster
        });
        let applicationClient = new ApplicationClient(applicationConfig);
        return applicationClient;
    }

    const configInstance =  {
        fdkHandler: router,
        extension: extension,
        apiRoutes: apiRoutes,
        webhookRegistry: extension.webhookRegistry,
        applicationProxyRoutes: applicationProxyRoutes,
        getPlatformClient: getPlatformClient,
        getApplicationClient: getApplicationClient
    };

    return syncInitialization? promiseInit.then(()=>configInstance).catch(()=>configInstance): configInstance;
}
