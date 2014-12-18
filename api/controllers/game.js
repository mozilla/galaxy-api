var Promise = require('es6-promise').Promise;

var Game = require('../models/game');
var utils = require('../../lib/utils');


module.exports = {
  create: function (request) {
    return new Promise(function (resolve, reject) {
      var game = new Game(request.payload);

      request.pg.client.query(
        'INSERT INTO games (slug, game_url, name, description, created) ' +
        'VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
        [game.slug, game.game_url, game.name, game.description],
        function (err, result) {
          if (err) {
            return reject(err);
          }

          // TODO: Throw error if row couldn't be inserted.
          resolve(err || result.rows[0]);
      });
    });
  },
  remove: function () {
  },
  get: function (request) {
    return Game.objects.get(request.pg.client, {
      idOrSlug: request.params.idOrSlug
    }).catch(utils.returnError);
  },
  update: function () {
  }
};
