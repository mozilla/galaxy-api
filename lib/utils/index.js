var Promise = require('es6-promise').Promise;


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


module.exports.Response = function (self) {
  return {
    success: function (body) {
      // Return 200 with success.
      self.status = 200;
      self.body = body || {success: true};
    },
    validationError: function (err) {
      // Return 400 for validation error.
      self.status = 400;
      self.body = err;
    },
    missing: function () {
      // Return 404 if game slug does not exist as a key in the database.
      self.status = 404;
      self.body = {error: 'not_found'};
    },
    dbError: function (err) {
      console.error('DB error: ' + err);
      // Return 500 for database error.
      self.status = 500;
      self.body = {error: 'db_error'};
    }
  };
};
