'use strict';
var Joi = require('joi');
var pg = require('pg');


var internals = {};


var isConnected = exports.isConnected = function () {
  return 'client' in internals;
};


internals._requireConnection = function (func) {

  return function () {
    if (!isConnected()) {
      throw new Error('Server not connected');
    }

    func.apply(this, arguments);
  };
};


exports.connect = function (connectionString) {
  Joi.string().regex(/(postgres|tcp):\/\/(.+)\/(.+)/).required()
     .validate(connectionString, function (err, data) {

    if (err) {
      throw err;
    }

    if (isConnected()) {
      console.warn('Server already connected');
    }

    pg.connect(connectionString, function (err, client, done) {

      if (err) {
        throw err;
      }

      internals.client = client;
      internals.done = done;
    });
  });
};


exports.disconnect = internals._requireConnection(function () {

  // Release the postgres client.
  internals.done(false);

  delete internals.client;
});


exports.query = internals._requireConnection(function () {

  return internals.client.query.apply(internals.client, arguments);
});
