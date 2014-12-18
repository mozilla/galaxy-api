var Promise = require('es6-promise').Promise;

var Game = require('../models/game');
var utils = require('../../lib/utils');


module.exports = {
  create: function (request) {
    return Game.objects.create(request.pg.client,
      request.payload
    );
  },
  remove: function () {
  },
  get: function (request) {
    return Game.objects.get(request.pg.client, {
      idOrSlug: request.params.idOrSlug
    });
  },
  update: function () {
  }
};
