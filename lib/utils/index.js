var Boom = require('boom');
var Promise = require('es6-promise').Promise;


module.exports.errors = require('./errors');


module.exports.isNumeric = function isNumeric(obj) {
  return !isNaN(parseFloat(obj)) && isFinite(obj);
};


module.exports.stringifyObject = stringifyObject = function (obj) {
  return obj instanceof Object ? JSON.stringify(obj) : obj;
};


module.exports.promisify = function (func) {
  return function () {
    var args = Array.prototype.slice.apply(arguments);

    return new Promise(function (resolve, reject) {
      func.apply({}, args.concat(function (err, value) {
        if (err) {
          reject(err);
        } else {
          resolve(value);
        }
      }));
    });
  };
};


module.exports.returnError = function (err) {
  console.error('Caught error: %s', stringifyObject(err));
  switch (err.name) {
    case 'DatabaseError':
      return Boom.badImplementation(err.message || 'database_error');
    case 'DoesNotExist':
      return Boom.notFound(err.message || 'does_not_exist');
    case 'ValidationError':
      return Boom.badRequest(err.message || 'validation_error');
    default:
      return Boom.badImplementation();
  }
};
