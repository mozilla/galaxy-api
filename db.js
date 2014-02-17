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
            client.end();
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
