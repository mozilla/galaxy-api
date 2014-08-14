var Promise = require('es6-promise').Promise;


module.exports.extend = function () {
  Array.prototype.slice.call(arguments, 1).forEach(function (src) {
    if (src) {
      for (var prop in src) {
        obj[prop] = src[prop];
      }
    }
  });
  return obj;
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


module.exports.Response = Response = function (self) {
  return {
    success: function (body) {
      // Return 200 with success.
      self.status = 200;
      self.body = body || {success: true};
    },
    validationError: function (err) {
      // Return 400 for validation error.
      self.status = 400;
      if (typeof err === 'object') {
        self.body = err;
      } else {
        self.body = {error: err};
      }
    },
    missing: function (err) {
      // Return 404 if game slug does not exist as a key in the database.
      console.error('Object not found: ' +
        (err instanceof Object ? JSON.stringify(err) : err));
      self.status = 404;
      self.body = {error: 'not_found'};
    },
    dbError: function (err) {
      // Return 500 for database error.
      console.error('DB error: ' +
        (err instanceof Object ? JSON.stringify(err) : err));
      self.status = 500;
      self.body = {error: 'db_error'};
    },
    serverError: function (err) {
      // Return 500 for server error.
      console.error('DB error: ' +
        (err instanceof Object ? JSON.stringify(err) : err));
      self.status = 500;
      self.body = {error: 'db_error'};
    }
  };
};


module.exports.CaughtResponse = function (response, err) {
  console.log(err);
  switch (err.name) {
    case 'DatabaseError':
      // Return 500 if there are any database exceptions.
      return response.dbError(err.message);
    case 'DoesNotExist':
      // Return 404 if game slug does not exist as a key in the database.
      return response.missing(err.message);
    case 'ValidationError':
      return response.validationError(err.message);
    default:
      return response.serverError(err);
  }
};
