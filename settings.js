var settings_local = {};
if ('GALAXY_API_SETTINGS' in process.env) {
  console.log('Using settings file ' + process.env.GALAXY_API_SETTINGS);
  settings_local = require(process.env.GALAXY_API_SETTINGS);
}

exports.DEBUG = false;
exports.ORIGIN = 'http://localhost/';
exports.PORT = 4000;
exports.REDIS_URL = 'redis://localhost:6379';
exports.SECRET = 'a secret string';

for (var k in settings_local) {
  exports[k] = settings_local[k];
}
