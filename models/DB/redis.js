var redis = require('redis');
var debug = require('debug')('goodtogo-linebot:redis');
debug.log = console.log.bind(console);
var config = require("../../config/config");

var redisClient = redis.createClient(6379, config.redisUrl, {
    password: config.redisPass,
    db: 1
});
regisRedisEvent(redisClient);

function regisRedisEvent(redisClient) {
    redisClient.on('ready', function() {
        debug('redisDB ready');
    });

    redisClient.on('connect', function() {
        debug('redisDB connect');
    });

    redisClient.on('reconnecting', function(delay, attempt) {
        debug('redisDB reconnecting');
    });

    redisClient.on('error', function(err) {
        debugError('redisDB err ', err);
    });
}

module.exports = redisClient;