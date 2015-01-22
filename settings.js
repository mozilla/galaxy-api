'use strict';

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

// Get a Steam API key here: http://steamcommunity.com/dev/apikey
// Appended to URLs as a `key` query-string parameter.
exports.STEAM_KEY = '';
// Provider URL listed here: http://steamcommunity.com/dev/
exports.STEAM_PROVIDER_URL = 'http://steamcommunity.com/openid';

exports.SECRET = 'a secret string';

Object.keys(settings_local).forEach(function (k) {
  exports[k] = settings_local[k];
});
