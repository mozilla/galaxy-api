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
