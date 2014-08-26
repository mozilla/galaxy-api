/**
 * Module dependencies.
 */
var body = require('koa-parse-json');
var compress = require('koa-compress');
var koa = require('koa');
var logger = require('koa-logger');
var ratelimit = require('koa-ratelimit');
var responseTime = require('koa-response-time');
var router = require('koa-router');

var db = require('./lib/db');
var load = require('./lib/load');
var settings = require('./settings');


/**
 * Environment.
 */
var env = process.env.NODE_ENV || 'development';

var application = {};


/**
 * Initialise an app with the given `opts`.
 *
 * @param {Object} opts
 * @return {Application}
 * @api public
 */
console.log('API initialised');


/**
 * Create app.
 */
var app = koa();

// Logging.
if (env !== 'test') {
  app.use(logger());
}

// X-Response-Time.
app.use(responseTime());

// Compression.
app.use(compress());

// Redis database.
app.redis = db.redis();

// Rate limiting.
if (settings.RATELIMIT_ENABLED) {
  app.use(ratelimit({
    max: ~~settings.RATELIMIT_MAX,
    duration: ~~settings.RATELIMIT_DURATION,
    db: app.redis
  }));
}

// Parse JSON bodies.
app.use(body());

// Routing.
app.use(router(app));

// Expose the application for other files to use.
module.exports.app = app;

// Boot.
load(app, __dirname + '/api');


/**
 * Listen.
 */
app.listen(settings.PORT, settings.HOST, ~~settings.BACKLOG);
console.log('Listening on %s:%s', settings.HOST, settings.PORT);
