const mongoose = require('mongoose');

const { Schema } = mongoose;
const { mongoConnection } = require('../common/mongo.init');

const secretCollection = 'secret';
const sessionCollection = 'session';
const orderCollection = 'order';

const OrderSchema = new Schema(
  {
    app_id: {
      type: String,
      required: true,
    },
    gid: {
      type: Object,
      required: true,
    },
    company_id: {
      type: String,
      required: true,
    },
    success_url: {
      type: String,
      required: true,
    },
    cancel_url: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound unique index on app_id and gid
OrderSchema.index({ app_id: 1, gid: 1 }, { unique: true });

const SecretSchema = new Schema(
  {
    app_id: {
      type: String,
      required: true,
      unique: true,
    },
    secrets: {
      type: Object,
      required: true,
    },
    company_id: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

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
  },
});

OrderSchema.index({
  app_id: 1,
  company_id: 1,
});

SessionSchema.index({
  app_id: 1,
  company_id: 1,
});

SecretSchema.index({
  app_id: 1,
  company_id: 1,
});

module.exports = {
  Secret: mongoConnection.model(secretCollection, SecretSchema),
  Order: mongoConnection.model(orderCollection, OrderSchema),
  Session: mongoConnection.model(sessionCollection, SessionSchema),
};
