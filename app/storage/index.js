'use strict';

const BaseStorage = require('./baseStorage');
const MemoryStorage = require('./memoryStorage');
const RedisStorage = require('./redisStorage');

module.exports = {
    BaseStorage,
    MemoryStorage,
    RedisStorage
};