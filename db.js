var fs = require('fs');
var path = require('path');
var url = require('url');

var redis = require('redis');

var utils = require('./lib/utils');


var redisURL = url.parse(process.env.REDIS_URL ||
                         process.env.REDISCLOUD_URL ||
                         process.env.REDISTOGO_URL ||
                         '');
redisURL.hostname = redisURL.hostname || 'localhost';
redisURL.port = redisURL.port || 6379;


function redisClient() {
    var client = redis.createClient(redisURL.port, redisURL.hostname);
    if (redisURL.auth) {
        client.auth(redisURL.auth.split(':')[1]);
    }
    return client;
}


function flatDB() {}
flatDB.prototype = {
    write: function(type, slug, data, callback) {
        data = JSON.stringify(data);

        var baseDir = path.resolve('data', type);
        var fn = path.resolve(baseDir, utils.slugify(slug) + '.json');

        if (!fs.existsSync(baseDir)) {
            console.error('Directory "' + baseDir + '" does not exist');
            utils.mkdirRecursive(baseDir);
        }

        fs.writeFile(fn, data, 'utf8', function(err) {
            if (err) {
                console.error('Error creating', fn + ':', err);
            }
            if (callback) {
                callback(err);
            }
        });
    },
    read: function(type, slug, callback) {
        var fn = path.resolve('data', type, utils.slugify(slug) + '.json');
        var output;
        try {
            output = JSON.parse(fs.readFileSync(fn, 'utf8').toString() || '{}');
            if (callback) {
                callback(null, output);
            }
            return output;
        } catch(e) {
            console.error('Error reading', fn + ':', e);
            callback(e, {});
            return {};
        }
    }
};
var flatDBClient = new flatDB();

module.exports.redis = redisClient;
module.exports.flatfile = flatDBClient;
