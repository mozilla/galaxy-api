var Game = require('../models/game');
var utils = require('../../lib/utils');


module.exports = {
  create: function (request, reply) {
    var game = new Game(request.payload);

    request.pg.client.query(
      'INSERT INTO games (description, game_url, name, slug, created) ' +
      'VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [game.description, game.game_url, game.name, game.slug],
      function (err, result) {
        if (err) {
          console.error(err);
        }
        // TODO: Throw error if row couldn't be inserted.
        reply(err || result.rows[0]);
    });
  },
  remove: function () {
  },
  get: function (request, reply) {
    var query = (utils.isNumeric(request.params.idOrSlug) ?
      'SELECT * FROM games WHERE id = $1' :
      'SELECT * FROM games WHERE slug = $1'
    );

    request.pg.client.query(query, [request.params.idOrSlug],
      function (err, result) {
        if (err) {
          console.error(err);
        }
        if (!result.rows.length) {
          // TODO: Return proper JSON when row couldn't be seleced.
          return reply({
            statusCode: 404,
            error: 'Not Found',
            message: 'No game found'
          }).code(404);
        }
        // TODO: Throw error for `err` when row couldn't get be selected.
        reply(err || result.rows[0]);
    });
  },
  update: function () {
  }
};
