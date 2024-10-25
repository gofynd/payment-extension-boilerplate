const config = require('../config');
const Bluebird = require('bluebird');
const mongoose = require('mongoose');

mongoose.Promise = Bluebird;

function setupMongoose(project) {
  const { uri, options } = project;

  const conn = mongoose.createConnection(uri, options);

  conn.on('connected', function () {
    console.log('MongoConnection Details: ', uri);
    console.log('Mongodb connected.');
  });
  conn.on('disconnected', function () {
    console.log('Mongodb disconnected.');
  });

  conn.on('error', function (err) {
    console.log(err);
  });
  return conn;
}

let mongoConnection = setupMongoose(config.mongodb.host);

module.exports = {
  mongoConnection,
};
