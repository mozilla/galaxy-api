'use strict';

var User = require('../models/user');


module.exports = {
  all: function (request) {
    return User.objects.all(request.params)
    .then(function (users) {
      return users.map(User.getPublicObj);
    });
  },
  create: function (request) {
    return User.objects.create(request.payload)
    .then(function (res) {
      return {
        body: User.getPublicObj(res.body),
        uri: res.uri
      };
    });
  },
  get: function (request) {
    return User.objects.get(request.params)
    .then(User.getPublicObj);
  },
  remove: function (request) {
    return User.objects.remove(request.params);
  },
  update: function (request) {
    return User.objects.update(request.params, request.payload)
    .then(function (res) {
      return {
        body: User.getPublicObj(res.body),
        uri: res.uri
      };
    });
  }
};
