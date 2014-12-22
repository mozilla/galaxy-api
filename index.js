var settings = require('./settings');

var Hapi = require('hapi');
var routes = require('./api/routes');


var server = new Hapi.Server();
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

server.start(function () {
  console.log('Listening on %s', server.info.uri);
});

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
