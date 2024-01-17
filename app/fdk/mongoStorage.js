const { BaseStorage } = require("fdk-extension-javascript/express/storage");
const { Session } = require("./../models/models")


class MongoStorage extends BaseStorage {

    getEpochTime(ttl=0) {
        return new Date().getTime() / 1000 + ttl;
    }

    async deleteExpired() {
        const currentEpochTime = new Date().getTime() / 1000;
        await Session.deleteMany({ expires: {$lt: currentEpochTime } });
    }

    async get(key) {
        await this.deleteExpired();
        const data = await Session.findOne({ session_id: key });
        if (!data) {
            return null;
        }
        return data.value;
    }

    async set(key, value) {
        await Session.findOneAndUpdate(
            { session_id: key },
            { value: value },
            { upsert: true }
        );
        return true;
    }

    async setex(key, value, ttl) {
        const expires = this.getEpochTime(ttl);
        await Session.findOneAndUpdate(
            { session_id: key },
            { value: value, expires: expires },
            { upsert: true }
        );
        return true;
    }

    async del(key) {
        await Session.deleteOne({ session_id: key });
        return true;
    }

    async hget(key, hashKey) {
        const hash = await Session.findOne({ session_id: key });
        if (!hash || !hash.value) {
            return null;
        }
        return hash.value[hashKey];
    }

    async hset(key, hashKey, value) {
        var hash = await Session.findOne({ session_id: key });
        if (!hash || !hash.value) {
            hash = {
                value: {}
            };
        }
        hash.value[hashKey] = value;
        await Session.findOneAndUpdate(
            { session_id: key },
            { value: hash.value },
            { upsert: true }
        );
        return true;
    }

    async hgetall(key) {
        return this.get(key);
    }
}

module.exports = MongoStorage