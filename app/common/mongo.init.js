const mongoose = require('mongoose');
const config = require('../config');

function setupMongoose(project) {
  const { uri, options } = project;

  const conn = mongoose.createConnection(uri, options);

  conn.on('connected', () => {
    console.log('MongoConnection Details: ', uri);
    console.log('Mongodb connected.');
  });
  conn.on('disconnected', () => {
    console.log('Mongodb disconnected.');
  });

  conn.on('error', err => {
    console.log(err);
  });
  return conn;
}

const mongoConnection = setupMongoose(config.mongodb.host);

module.exports = {
  mongoConnection,
};
