var Promise = require('es6-promise').Promise;

var Game = require('../models/game');
var utils = require('../../lib/utils');


module.exports = {
  all: function (request) {
    return Game.objects.all(request.pg.client,
      request.params);
  },
  create: function (request) {
    return Game.objects.create(request.pg.client,
      request.payload
    );
  },
  get: function (request) {
    return Game.objects.get(request.pg.client, {
      idOrSlug: request.params.idOrSlug
    });
  },
  remove: function () {
  },
  update: function () {
  }
};
