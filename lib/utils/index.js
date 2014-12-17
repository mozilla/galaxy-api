var Promise = require('es6-promise').Promise;


module.exports.isNumeric = function isNumeric(obj) {
  return !isNaN(parseFloat(obj)) && isFinite(obj);
};


module.exports.promisify = function promisify(func) {
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
