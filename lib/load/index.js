/**
 * Module dependencies.
 */

var path = require('path');
var fs = require('fs');
var join = path.resolve;
var readdir = fs.readdirSync;

var debug = require('debug')('api');


/**
 * Load resources in `root` directory.
 *
 * @param {Application} app
 * @param {String} root
 * @api private
 */
module.exports = function (app, root) {
  readdir(root).forEach(function (file) {
    var dir = join(root, file);
    var stats = fs.lstatSync(dir);
    if (stats.isDirectory()) {
      var conf = require(dir + '/config.json');
      conf.name = file;
      conf.directory = dir;
      if (conf.routes) {
        route(app, conf);
      }
    }
  });
};


/**
 * Define routes in `conf`.
 */
function route(app, conf) {
  debug('routes: %s', conf.name);

  var mod = require(conf.directory);

  Object.keys(conf.routes).forEach(function (key) {
    var prop = conf.routes[key];
    var chunks = key.split(' ');
    var method = chunks[0];
    var path = chunks[1];
    debug('%s %s -> .%s', method, path, prop);

    var fn = mod[prop];
    if (!fn) {
      throw new Error(conf.name + ': exports.' + prop + ' is not defined');
    }

    app[method.toLowerCase()](path, fn);
  });
}
