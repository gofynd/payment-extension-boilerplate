'use strict';
const validator = require('validator');
const { InvalidExtensionConfig } = require("./error_codes");
const urljoin = require('url-join');
const { WebhookRegistry } = require('./webhook');
const logger = require("../common/logger");
const { Secret } = require("../models/models");

const { version } = require('../../package.json');
const { AxiosHelper } = require('../common/axiosHelper');

const config =  require("../config");
const { RedisStorage } = require("../storage/index");
const { redisClient } = require("../common/redis.init");



class Extension {
    constructor() {
        this.api_key = null;
        this.api_secret = null;
        this.storage = null;
        this.base_url = null;
        this.callbacks = null;
        this.access_mode = null;
        this.cluster = "https://api.fynd.com";
        this.webhookRegistry = null;
        this._isInitialized = false;
    }

    async initialize(data) {

        this._isInitialized = false;

        this.storage = data.storage;

        if (!data.api_key) {
            throw new InvalidExtensionConfig("Invalid api_key");
        }
        this.api_key = data.api_key;

        if (!data.api_secret) {
            throw new InvalidExtensionConfig("Invalid api_secret");
        }
        this.api_secret = data.api_secret;

        if (!data.callbacks || (data.callbacks && (!data.callbacks.auth ))) {
            throw new InvalidExtensionConfig("Missing some of callbacks. Please add all `auth` callbacks.");
        }

        this.callbacks = data.callbacks;
        this.access_mode = data.access_mode || "offline";

        if (data.cluster) {
            if (!validator.isURL(data.cluster)) {
                throw new InvalidExtensionConfig("Invalid cluster value. Invalid value: " + data.cluster);
            }
            this.cluster = data.cluster;
        }
        this.webhookRegistry = new WebhookRegistry();

        let extensionData = await this.getExtensionDetails();

        if (data.base_url && !validator.isURL(data.base_url)) {
            throw new InvalidExtensionConfig("Invalid base_url value. Invalid value: " + data.base_url);
        }
        else if (!data.base_url) {
            data.base_url = extensionData.base_url;
        }
        this.base_url = data.base_url;

        if (data.scopes) {
            data.scopes = this.verifyScopes(data.scopes, extensionData);
        }
        this.scopes = data.scopes || extensionData.scope;

        logger.debug(`Extension initialized`);

        if (data.webhook_config && Object.keys(data.webhook_config)) {
            await this.webhookRegistry.initialize(data.webhook_config, data);
        }

        this._isInitialized = true;
    }

    get isInitialized(){
        return this._isInitialized;
    }

    verifyScopes(scopes, extensionData) {
        const missingScopes = scopes.filter(val => extensionData.scope.indexOf(val) === -1);
        if (!scopes || scopes.length <= 0 || missingScopes.length) {
            throw new InvalidExtensionConfig("Invalid scopes in extension config. Invalid scopes: " + missingScopes.join(", "));
        }
        return scopes;
    }

    isOnlineAccessMode() {
        return this.access_mode === 'online';
    }

    async getExtensionDetails() {
        try {
            let url = `${this.cluster}/service/panel/partners/v1.0/extensions/details/${this.api_key}`;
            const token = Buffer.from(
                `${this.api_key}:${this.api_secret}`,
                "utf8"
            ).toString("base64");
            const rawRequest = {
                method: "get",
                url: url,
                headers: {
                    Authorization: `Basic ${token}`,
                    "Content-Type": "application/json",
                    'x-ext-lib-version': `js/${version}`
                },
            };
            let extensionData = await AxiosHelper.request(rawRequest);
            logger.debug(`Extension details received: ${extensionData}`);
            return extensionData;
        } catch (err) {
            throw new InvalidExtensionConfig("Invalid api_key or api_secret. Reason:" + err.message);
        }
    }
}

async function deleteCredentialsHandler (req){
    const { company_id } = req.body;
    console.log(`Uninstalling extension for company: ${company_id}`);
    await Secret.deleteMany({ company_id: company_id });
}

let data = {
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

function getExtensionInstanceHandler(req) {
    let ext = new Extension();
    ext.initialize(data);
    config.ext = ext;
}

// let extension = new Extension();
module.exports = {
    getExtensionInstanceHandler: getExtensionInstanceHandler,
    configData: data
};
