var urllib = require('url');

var redis = require('romis');


var redisURL = urllib.parse(process.env.REDIS_URL || '');


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
 *
 * @api private
 */
module.exports.redis = function () {
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
};
