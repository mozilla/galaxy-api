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

var redis = require('redis');

var load = require('./lib/load');


/**
 * Environment.
 */
var env = process.env.NODE_ENV || 'development';


/**
 * Expose `api()`.
 */
module.exports = api;


/**
 * Initialise an app with the given `opts`.
 *
 * @param {Object} opts
 * @return {Application}
 * @api public
 */
function api(opts) {
  opts = opts || {};

  var app = koa();

  // Logging.
  if (env !== 'test') {
    app.use(logger());
  }

  // X-Response-Time.
  app.use(responseTime());

  // Compression.
  app.use(compress());

  // Rate limiting.
  app.use(ratelimit({
    max: opts.ratelimit,
    duration: opts.duration,
    db: redis.createClient()
  }));

  // Parse JSON bodies.
  app.use(body());

  // Routing.
  app.use(router(app));

  // Boot.
  load(app, __dirname + '/api');

  return app;
}
