const mongoose = require('mongoose');
const _ = require('lodash');
const Schema = mongoose.Schema;
const { mongoConnection } = require('../common/mongo.init');

const orderCollection = "order";
const secretCollection = "secret";
const userCollection = "user";
const addressCollection = "address";
const transactionCollection = "transaction";
const aggregatorStatusMapperCollection = "aggregatorstatusmappercollection";
const sessionCollection = "session";


const OrderSchema = new Schema({
    gid: {
        type: String,
        required: true,
        unique: true
    },
    aggregator_order_id: {
        type: String,
        required: true,
        unique: true
    },
    app_id: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true
    },
    g_user_id: {
        type: String,
        required: true,
    },
    payment_methods: {
        type: Object,
        required: true
    },
    billing_address: {
        type: Object,
        required: false
    },
    shipping_address: {
        type: Object,
        required: false
    },
    currency: {
        type: String,
        required: true
    },
    meta: {
        type: Object,
        required: false
    },
    locale: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

const TransactionStatusSchema = new Schema({
    status: {
        type: String,
        required: true,
    },
    meta: {
        type: Object,
        required: false,
    },
}, {
    timestamps: true
});

const TransactionSchema =  new Schema({
    gid: {
        type: String,
        required: true,
    },
    g_user_id: {
        type: String,
        required: true,
    },
    aggregator_order_id: {
        type: String,
        required: true,
    },
    journey_type: {
        type: String,
        enum: ["forward", "refund"],
        default: "forward",
        required: true,
    },
    aggregator_payment_id: {
        type: String,
        required: false,
        sparse: true
    },
    aggregator_refund_id: {
        type: String
    },
    refund_request_id: {
        type: String,
        unique: true,
        sparse: true
    },
    amount: {
        type: Number,
        required: true,
    },
    current_status: {
        type: String,
        required: true
    },
    status: {
        type: [TransactionStatusSchema],
        required: true,
    }
}, {
    timestamps: true
});

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

const UserSchema = new Schema({
    g_user_id: {
        type: String,
        required: true,
        unique: true
    },
    app_id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: false,
    },
    mobile: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: false,
    },
    aggregator_user_id: {
        type: String,
        required: false,
    }
}, {
    timestamps: true
});

const AddressSchema = new Schema({
    g_address_id: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: false,
    },
    country_phone_code: {
        type: String,
        required: false,
    },
    country_iso_code: {
        type: String,
        required: false,
    },
    geo_location: {
        type: Object,
        required: false,
    },
    google_map_point: {
        type: Object,
        required: false,
    },
    state: {
        type: String,
        required: false,
    },
    landmark: {
        type: String,
        required: false,
    },
    name: {
        type: String,
        required: false,
    },
    tags: {
        type: Array,
        required: false,
    },
    address: {
        type: String,
        required: false,
    },
    area: {
        type: String,
        required: false,
    },
    country: {
        type: String,
        required: false,
    },
    city: {
        type: String,
        required: false,
    },
    address_type: {
        type: String,
        required: false,
    },
    area_code_slug: {
        type: String,
        required: false,
    },
    area_code: {
        type: String,
        required: false,
    },
})

const AggregatorStatusMapperSchema = new Schema({
    aggregator_status: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    journey_type: {
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

OrderSchema.index({
    gid: 1,
    current_status: 1,
    app_id: 1,
}, { unique: true });

TransactionSchema.index({
    gid: 1,
    refund_request_id: 1,
});

SecretSchema.index({
    app_id: 1,
    company_id: 1
});

UserSchema.index({
    g_user_id: 1,
    app_id: 1,
    aggregator_user_id: 1
});
AggregatorStatusMapperSchema.index({
    aggregator_status: 1,
    journey_type: 1,
    status: 1
}, { unique: true });


module.exports = {
    Order: mongoConnection.model(orderCollection, OrderSchema),
    Secret: mongoConnection.model(secretCollection, SecretSchema),
    Session: mongoConnection.model(sessionCollection, SessionSchema),
    User: mongoConnection.model(userCollection, UserSchema),
    Transaction: mongoConnection.model(transactionCollection, TransactionSchema),
    Address: mongoConnection.model(addressCollection, AddressSchema),
    AggregatorStatusMapper: mongoConnection.model(aggregatorStatusMapperCollection, AggregatorStatusMapperSchema)
};
