var fs = require('fs');
var path = require('path');
var url = require('url');

var redis = require('redis');

var redisURL = url.parse(process.env.REDIS_URL ||
                         process.env.REDISCLOUD_URL ||
                         process.env.REDISTOGO_URL ||
                         '');
redisURL.hostname = redisURL.hostname || 'localhost';
redisURL.port = redisURL.port || 6379;
var redisClient = redis.createClient(redisURL.port, redisURL.hostname);
if (redisURL.auth) {
    redisClient.auth(redisURL.auth.split(':')[1]);
}

var utils = require('./lib/utils');


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
                callback(err, data);
            }
        });
    },
    read: function(type, slug, callback) {
        var fn = path.resolve('data', type, utils.slugify(slug) + '.json');
        var err = null;
        var output;

        try {
            output = JSON.parse(fs.readFileSync(fn, 'utf8').toString() || '{}');
        } catch(e) {
            console.error('Error reading', fn + ':', e);
            err = e;
            output = {};
        }

        if (callback) {
            callback(err, output);
        }

        return output;
    },
    update: function(type, slug, data, callback) {
        var fn = path.resolve('data', type, utils.slugify(slug) + '.json');
        var err = null;

        fs.readFile(fn, 'utf8', function(err, oldData) {
            data = _.extend(oldData, data);
            this.write(type, slug, data, callback);
        });
    }
};
var flatDBClient = new flatDB();

module.exports.redis = redisClient;
module.exports.flatfile = flatDBClient;
