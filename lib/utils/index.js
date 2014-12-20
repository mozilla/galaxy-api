var Boom = require('boom');
var Promise = require('es6-promise').Promise;


module.exports.errors = require('./errors');


module.exports.isStringAnInt = function (str) {
  var num = Number(str);
  return String(num) === str && num >= 0;
};


var stringifyObject = module.exports.stringifyObject = function (obj) {
  return typeof obj === 'object' ? JSON.stringify(obj) : obj;
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
  if (err instanceof Object) {
    if (err instanceof Error) {
      console.error('Caught stack:\n%s', err.stack);
    } else if (err.name) {
      console.error('Caught rejection:\n%s', stringifyObject(err));

      switch (err.name) {
        case 'DatabaseError':
          // NOTE: The response will actually contain this generic message:
          // "An internal server error occurred"
          return Boom.internal(err.message || 'database_error', {error: err});
        case 'DoesNotExist':
          return Boom.notFound(err.message || 'does_not_exist');
        case 'ValidationError':
          return Boom.badRequest(err.message || 'validation_error');
      }
    }
  }

  return Boom.badImplementation(err);
};
