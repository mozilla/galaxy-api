var settings_local = {};

var settings_path = process.env.GALAXY_API_SETTINGS;
if (settings_path) {
  if (settings_path[0] !== '.' &&
      settings_path[0] !== '/' &&
      settings_path[0] !== '~') {
    // Assume it's a relative path.
    settings_path = './' + settings_path;
  }
  console.log('Using settings file ' + settings_path);
  settings_local = require(settings_path);
}

exports.DEBUG = false;
exports.ORIGIN = 'http://localhost:4000';

exports.HOST = '0.0.0.0';
exports.PORT = 4000;

// Usage: postgres://user:password@host/database
exports.POSTGRES_URL = 'postgres://localhost/galaxy-api';

exports.SECRET = 'a secret string';

for (var k in settings_local) {
  if (settings_local.hasOwnProperty(k)) {
    exports[k] = settings_local[k];
  }
}
