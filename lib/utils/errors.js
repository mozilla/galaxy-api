'use strict';

module.exports = {};

[
  'DatabaseError',
  'DoesNotExist',
  'ValidationError'
].forEach(function (key) {
  module.exports[key] = function (message) {
    return {
      name: key,
      message: message
    };
  };
});
