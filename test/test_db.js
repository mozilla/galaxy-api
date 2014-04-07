// TODO: This file is temporarily, and should be removed once 
// we added test support in ../db.js
var url = require('url');
var redis = require('redis');

function redisClient(urlString) {
    var redisURL = url.parse(urlString || '');
    var client = redis.createClient(redisURL.port, redisURL.hostname);
    if (redisURL.auth) {
        client.auth(redisURL.auth.split(':')[1]);
    }
    return client;
}
exports.client = redisClient;
