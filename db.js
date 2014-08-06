var fs = require('fs');
var path = require('path');
var url = require('url');

var redis = require('redis');

var utils = require('./lib/utils');

var settings = require('./settings');


var redisURL = url.parse(settings.REDIS_URL);
redisURL.hostname = redisURL.hostname || 'localhost';
redisURL.port = redisURL.port || 6379;

var Scripto = require('redis-scripto');
var manager = new Scripto(redisClient());
manager.loadFromDir('./lua');

function scriptManager() {
    return manager;
}
exports.scriptManager = scriptManager;

var redisURL = url.parse(settings.REDIS_URL);

/**
 * Establish connection to Redis database.
 *
 * You must first define an environment variable, like so:
 *
 *     export REDIS_URL='redis://[db-number[:password]@]host:port'
 *     export REDIS_URL='redis://[[:password]@]host:port/[db-number]'
 *
 * All fields after the scheme are optional and will default to
 * `localhost` on port `6379`, using database `0`.
 *
 * This is a good default:
 *
 *     export REDIS_URL='redis://localhost:6379'
 *
 */
 function redisClient() {
    var client = redis.createClient(parseInt(redisURL.port || '6379', 10),
        redisURL.hostname || 'localhost');

    var redisAuth = (redisURL.auth || '').split(':');
    var db = redisAuth[0];
    var passwd = redisAuth[1];

    if (passwd = redisAuth[1]) {
        client.auth(passwd, function (err) {
            if (err) {
                throw err;
            }
        });
    }

    if (!db && redisURL.pathname && redisURL.pathname !== '/') {
        db = redisURL.pathname.substring(1);
    }

    if (db) {
        client.select(db);
        client.on('connect', function () {
            redis.send_anyways = true;
            redis.select(db);
            redis.send_anyways = false;
        });
    }

    return client;
}
exports.redis = redisClient;

// TODO: Make this use a pool.
var persistentRedisConnection;
function redisView(view, persistent) {
    /*
    Exposes a view wrapper that establishes a connection to the redis
    server, processes the view, then cleans up the connection.

    server.post(
        '/foo/bar',
        redisView(function(client, done, req, res, wrap) {
            client.set('hello', 'cvan');
            somethingAsync(wrap(function(err) {
                if (err) {
                    throw new Error('This will close the connection');
                }
                res.send('haldo');
                client.set('goodbye', 'cvan');
                done();
            }));
        })
    );

    Passing a truthy value to the `persistent` argument will use a single
    persistent connection rather than creating a new one for each request.

    Wrap async functions with `wrap` to close the connection when errors
    are thrown within those functions.

    Call `done()` at every point that your view can finish executing.

    `wrap` will always be the final argument passed to the view. `client`
    and `done` will always be the first two.

    Note that you should never call `client.end()` if you're using a
    persistent connection.
    */
    return function() {
        var args = Array.prototype.slice.call(arguments, 0);
        var client;
        // TODO: Handle connection failures and return a 5xx
        if (!persistent) {
            client = redisClient();
        } else {
            client = persistentRedisConnection ||
                (persistentRedisConnection = redisClient());
        }

        var killed = false;
        function done() {
            // Don't clean up the persistent connection, or if we've already
            // cleaned up.
            if (persistent || killed) {
                return;
            }
            client.quit();
            killed = true;
        }
        function wrap(call) {
            return function() {
                try {
                    return call.apply(this, arguments);
                } catch(e) {
                    done();
                    throw e;
                }
            };
        }
        return wrap(view).apply(this, [client, done].concat(args).concat([wrap]));
    };
}
exports.redisView = redisView;


function plsNoError(res, done, callback) {
    return function(err, result) {
        if (err) {
            res.json(500, {error: 'db_error'});
            done();
            return;
        }
        callback(result);
    };
}
exports.plsNoError = plsNoError;
