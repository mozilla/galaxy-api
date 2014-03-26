var restify = require('restify');
var restifySwagger = require('node-restify-swagger');
var restifyValidation = require('node-restify-validation');

var auth = require('./lib/auth');
var pkg = require('./package');
var settings = require('./settings_local');

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

// This overrides restify's default uncaught exception handler, so we
// need to send the default response ourselves.
var InternalError = restify.errors.InternalError;
server.on('uncaughtException', function (req, res, route, e) {
    // Send the actual error in debug mode only
    var msg = (settings.DEBUG ? e.message : null) || 'unexpected error';
    res.send(new InternalError(e, msg));

    var routeDesc = '[' + req.method + '] ' + req.url;
    console.error('Uncaught exception in ' + routeDesc + ':\n' + e.stack);

    return true;
});

restifySwagger.configure(server);
restifySwagger.loadRestifyRoutes();

module.exports = server;
