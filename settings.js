var settings_local = {};
if ('GALAXY_API_SETTINGS' in process.env) {
  console.log('Using settings file ' + process.env.GALAXY_API_SETTINGS);
  settings_local = require(process.env.GALAXY_API_SETTINGS);
}

exports.DEBUG = false;
exports.ORIGIN = 'http://localhost/';

exports.HOST = '0.0.0.0';
exports.PORT = 4000;
exports.BACKLOG_SIZE = 511;

exports.RATELIMIT_ENABLED = false;
exports.RATELIMIT_MAX = 2500;  // Max number of requests
exports.RATELIMIT_DURATION = '1h';  // Duration of ratelimiting

exports.REDIS_URL = 'redis://localhost:6379';
exports.SECRET = 'a secret string';

for (var k in settings_local) {
  exports[k] = settings_local[k];
}
