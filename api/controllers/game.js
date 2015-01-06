var Promise = require('es6-promise').Promise;

var Game = require('../models/game');


module.exports = {
  all: function (request) {
    return Game.objects.all(request.params)
    .then(function (games) {
      return games.map(Game.getPublicObj);
    });
  },
  create: function (request) {
    return Game.objects.create(request.payload)
    .then(function (res) {
      return {
        body: Game.getPublicObj(res.body),
        uri: res.uri
      };
    });
  },
  get: function (request) {
    return Game.objects.get(request.params)
    .then(Game.getPublicObj);
  },
  remove: function (request) {
    return Game.objects.remove(request.params);
  },
  update: function (request) {
    return Game.objects.update(request.params, request.payload)
    .then(function (res) {
      return {
        body: Game.getPublicObj(res.body),
        uri: res.uri
      };
    });
  }
};
