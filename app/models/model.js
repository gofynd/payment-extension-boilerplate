const mongoose = require('mongoose');
const _ = require('lodash');
const Schema = mongoose.Schema;
const { mongoConnection } = require('../common/mongo.init');

const secretCollection = "secret";
const sessionCollection = "session";

const SecretSchema = new Schema({
    app_id: {
        type: String,
        required: true,
        unique: true
    },
    secrets: {
        type: Object,
        required: true
    },
    company_id: {
        type: String,
        required: true,
    }
}, {
    timestamps: true
});

const SessionSchema = new Schema({
    session_id: {
        type: String,
        required: true,
    },
    value: {
        type: Object,
        required: false,
    },
    expires: {
        type: Number,
        required: false,
    }
});

SessionSchema.index({
    session_id: 1,
    expires: 1,
});

SecretSchema.index({
    app_id: 1,
    company_id: 1
});


module.exports = {
    Secret: mongoConnection.model(secretCollection, SecretSchema),
    Session: mongoConnection.model(sessionCollection, SessionSchema),
};
