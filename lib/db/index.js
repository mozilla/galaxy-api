var urllib = require('url');

var redis = require('romis');

var settings = require('../../settings');


var redisURL = urllib.parse(settings.REDIS_URL);


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
  console.log('Connecting to Redis database ' +
              redisURL.hostname + ':' + redisURL.port);
  var redisAuth = (redisURL.auth || '').split(':');
  var db = redisAuth[0];
  if (!db) {
    db = (redisURL.pathname || '').substr(1);
  }
  var passwd = redisAuth[1];

  if (passwd) {
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
    console.log('Selecting Redis database ' + db);
    client.select(db);
  }

  return client;
};
