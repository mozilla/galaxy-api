'use strict';

module.exports = {
  DEBUG: false,
  ORIGIN: 'http://localhost:4000',
  HOST: '0.0.0.0',
  PORT: 4000,

  // Usage: postgres://user:password@host/database
  POSTGRES_URL: 'postgres://localhost/galaxy-api',

  // Change this!
  SECRET: 'a secret string'
};


var settings_path = process.env.GALAXY_API_SETTINGS;

if (settings_path) {
  var settings_local = {};

  if (settings_path.substr(0, 2) !== './') {
    // Assume it's a relative path.
    settings_path = './' + settings_path;
  }

  console.log('Using settings file ' + settings_path);
  settings_local = require(settings_path);

  Object.keys(settings_local).forEach(function (k) {
    module.exports[k] = settings_local[k];
  });
}
