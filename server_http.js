var restify = require('restify');
var restifySwagger = require('node-restify-swagger');
var restifyValidation = require('node-restify-validation');

var pkg = require('./package');
var auth = require('./lib/auth');

var server = restify.createServer({
    name: pkg.name,
    version: pkg.version
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());
server.use(restify.CORS());
server.use(restify.gzipResponse());
server.use(restify.queryParser());
server.use(restifyValidation.validationPlugin({errorsAsArray: false}));
server.use(auth.verifySSAPlugin());

server.get(/\/static\/?.*/, restify.serveStatic({
    directory: './static'
}));

server.get(/\/data\/?.*/, restify.serveStatic({
    directory: './data'
}));

restifySwagger.configure(server);
restifySwagger.loadRestifyRoutes();

module.exports = server;
