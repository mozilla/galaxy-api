'use strict';

var Boom = require('boom');


exports.errors = require('./errors');


exports.isStringAUuid = function (str) {
  if (!str) {
    return false;
  }
  var regex = new RegExp(
    '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'
  );
  return str.match(regex) !== null;
};


exports.stringifyObject = function (obj) {
  return typeof obj === 'object' ? JSON.stringify(obj) : obj;
};


exports.promisify = function (func) {
  return function () {
    // Bail if the function is already a promise.
    if (func && typeof func.then === 'function') {
      return func;
    }

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


exports.returnError = function (err) {
  if (err instanceof Object) {
    if (err instanceof Error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Caught stack:\n%s', err.stack);
      }
    } else if (err.name) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Caught rejection:\n%s', exports.stringifyObject(err));
      }

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


// This wraps the handlers and calls the following for each the promise
// returned by the controller handlers:
//
//   …
//   .catch(function (err) {
//
//     reply(utils.returnError(err));
//   });
//
exports.safeHandler = function (func) {

  return function (request, reply) {

    func.apply(this, arguments).catch(function (err) {

      reply(exports.returnError(err));
    });
  };
};
