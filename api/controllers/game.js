var Game = require('../models/game');
var utils = require('../../lib/utils');


module.exports = {
  create: function (request) {
    var game = new Game(request.payload);

    request.pg.client.query(
      'INSERT INTO games (description, game_url, name, slug, created) ' +
      'VALUES ($1, $2, $3, $4, NOW())',
      [game.description, game.game_url, game.name, game.slug],
      function (err, result) {
        if (err) {
          console.error(err);
        }
        return result;
    });
  },
  remove: function () {
  },
  get: function (request) {
    var query = (utils.isNumeric(request.params.idOrSlug) ?
      'SELECT * FROM games WHERE id = $1' :
      'SELECT * FROM games WHERE slug = $1'
    );

    request.pg.client.query(query, [request.params.idOrSlug],
      function (err, result) {
        if (err) {
          console.error(err);
        }
        return result;
    });
  },
  update: function () {
  }
};
