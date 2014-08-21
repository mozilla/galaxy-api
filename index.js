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

var program = require('commander');

// var application = require('./application');
var db = require('./lib/db');
var load = require('./lib/load');


/**
 * Environment.
 */
var env = process.env.NODE_ENV || 'development';

var application = {};


/**
 * Options.
 */
// TODO: Load settings from `GALAXY_API_SETTINGS` file.
program
  .option('-H, --host <host>', 'specify the host [$HOST || 0.0.0.0]',
    process.env.GALAXY_API_HOST || '0.0.0.0')
  .option('-p, --port <port>', 'specify the port [$PORT || 4000]',
    process.env.GALAXY_API_PORT || '4000')
  .option('-b, --backlog <size>', 'specify the backlog size [511]',
    process.env.GALAXY_API_BACKLOG || '511')
  .option('-r, --ratelimit <n>', 'ratelimit requests [2500]',
    process.env.GALAXY_API_RATELIMIT || '2500')
  .option('-d, --ratelimit-duration <ms>', 'ratelimit duration [1h]',
    process.env.GALAXY_API_RATELIMIT_DURATION || '1h')
  .parse(process.argv);


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
// app.use(ratelimit({
//   max: ~~program.ratelimit
//   duration: ~~program.ratelimitDuration
//   db: app.redis
// }));

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
app.listen(program.port, program.host, ~~program.backlog);
console.log('Listening on %s:%s', program.host, program.port);
