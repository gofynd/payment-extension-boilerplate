'use strict';
const Session = require("./session");
const { getExtensionInstanceHandler, configData } = require("./extension");
const logger = require("../common/logger");
const { redisClient } = require("../common/redis.init");
const config = require("../config");
const { RedisStorage } = require("../storage");

class SessionStorage {
    constructor() {
    }
    static async saveSession(session) {
        let storage = new RedisStorage(redisClient, config.extension_slug)
        if(session.expires) {
            let ttl = (new Date() - session.expires) / 1000;
            ttl = Math.abs(Math.round(Math.min(ttl, 0)));
            return storage.setex(session.id, JSON.stringify(session.toJSON()), ttl);
        } else {
            return storage.set(session.id, JSON.stringify(session.toJSON()));
        }
    }

    static async getSession(sessionId) {
        let extension = getExtensionInstanceHandler();
        extension.initialize(configData);
        let session = await extension.storage.get(sessionId);
        if(session) {
            session = JSON.parse(session);
            session = Session.cloneSession(sessionId, session, false);
        }
        else {
            logger.debug(`Session data not found for session id ${sessionId}`);
        }
        return session;
    }

    static async deleteSession(sessionId) {
        return extension.storage.del(sessionId);
    }
}

module.exports = SessionStorage;