'use strict';
var Hapi = require('hapi');

var db = require('./lib/db');
var routes = require('./api/routes');
var settings = require('./settings');


var server = module.exports = new Hapi.Server();
server.connection({
  host: settings.HOST,
  port: settings.PORT,
  routes: {
    validate: {
      options: {
        abortEarly: false
      }
    }
  }
});

routes(server);

// Do not start the server when this script is required by another script.
if (!module.parent) {
  server.start(function () {
    console.log('Listening on %s', server.info.uri);
  });
}


var pgPlugin = {
  register: function (server, options, next) {
    db.connect(options.connectionString);

    server.on('stop', function () {
      db.disconnect();
    });

    next();
  }
};


pgPlugin.register.attributes = {
  name: 'pgPlugin',
  version: '1.0.0'
};


server.register({
  register: pgPlugin,
  options: {
    connectionString: settings.POSTGRES_URL
  }
}, function (err) {
  if (err) {
    console.error('Failed to load "pgPlugin" plugin: %s', err);
    throw err;
  }
});
