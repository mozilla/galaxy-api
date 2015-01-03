var settings = require('./settings');

var Hapi = require('hapi');
var routes = require('./api/routes');


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

server.register({
  register: require('hapi-node-postgres'),
  options: {
    connectionString: settings.POSTGRES_URL
  }
}, function (err) {
  if (err) {
    console.error('Failed to load "hapi-node-postgres" plugin: %s', err);
    throw err;
  }
});
