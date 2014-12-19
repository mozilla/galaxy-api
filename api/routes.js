var joi = require('joi');

var gameController = require('./controllers/game.js');
var utils = require('../lib/utils');


var gameSchema = {
  // Game Description is optional.
  description: joi.string().example('Mario Bros. is a sweet adventure game.'),

  // Game URL must start with `https://` or `http://`.
  game_url: joi.string().regex(/^https?:\/\//).required()
    .example('http://nintendo.com/mario-bros/'),

  // Game Name cannot be longer than 150 characters long.
  name: joi.string().max(150).required()
    .example('Mario Bros.'),

  // Game Slug cannot be all digits, all underscores, or all hyphens
  // and must contain only letters, numbers, underscores, and hyphens.
  // TODO: Throw an error if `slug` is already taken.
  slug: joi.string().regex(/^(?!\d*$)(?!_*$)(?!-*$)[\w-]+$/).required()
    .example('mario-bros')
};


module.exports = function (server) {
  /*
  Sample usage:

    curl 'http://localhost:4000/games'

  */
  server.route({
    method: 'GET',
    path: '/games',
    handler: function (request, reply) {
      gameController.all(request)
      .then(reply)
      .catch(function (err) {
        reply(utils.returnError(err));
      });
    }
  });

  /*
  Sample usage:

    curl -X POST 'http://localhost:4000/games' \
      -d '{"name": "mario bros", "game_url": "http://nintendo.com", "slug": "mario"}' \
      -H 'Content-Type: application/json'

  */
  server.route({
    method: 'POST',
    path: '/games',
    handler: function (request, reply) {
      gameController.create(request)
      .then(reply)
      .catch(function (err) {
        reply(utils.returnError(err));
      });
    },
    config: {
      validate: {
        payload: gameSchema
      }
    }
  });

  /*
  Sample usage:

    curl 'http://localhost:4000/games/1'
    curl 'http://localhost:4000/games/mario'

  */
  // TODO: Throw error if neither `/games/{id}` nor `/games/{slug}` resolves.
  server.route({
    method: 'GET',
    path: '/games/{idOrSlug}',
    handler: function (request, reply) {
      gameController.get(request)
      .then(reply)
      .catch(function (err) {
        reply(utils.returnError(err));
      });
    },
    // config: {
    //   validate: {
    //     params: {
    //       // Game Slug cannot be all digits, all underscores, or all hyphens
    //       // and must contain only letters, numbers, underscores, and hyphens.
    //       // TODO: ID *or* slug is required; enforce.
    //       idOrSlug: joi.number().integer().example('9'),

    //       // Game Slug cannot be all digits, all underscores, or all hyphens
    //       // and must contain only letters, numbers, underscores, and hyphens.
    //       // TODO: ID *or* slug is required; enforce.
    //       idOrSlug: joi.string().regex(/^(?!\d*$)(?!_*$)(?!-*$)[\w-]+$/)
    //         .example('mario-bros')
    //     }
    //   }
    // }
  });

  /*
  Sample usage:

    curl -X DELETE 'http://localhost:4000/games/1'
    curl -X DELETE 'http://localhost:4000/games/mario'

  */
  server.route({
    method: 'DELETE',
    path: '/games/{idOrSlug}',
    handler: function (request, reply) {
      gameController.remove(request)
      .then(reply)
      .catch(function (err) {
        reply(utils.returnError(err));
      });
    }
  });

  /*
  Sample usage:

    curl -X PUT 'http://localhost:4000/games/1' \
      -d '{"name": "mario bros", "game_url": "http://nintendo.com", "slug": "mario"}' \
      -H 'Content-Type: application/json' -i
    curl -X PUT 'http://localhost:4000/games/mario' \
      -d '{"name": "mario bros", "game_url": "http://nintendo.com", "slug": "mario"}' \
      -H 'Content-Type: application/json' -i
    curl -X PUT 'http://localhost:4000/games/wario' \
      -d '{"name": "wario bros", "game_url": "http://wintendo.com", "slug": "wario"}' \
      -H 'Content-Type: application/json' -i

  */
  server.route({
    method: 'PUT',
    path: '/games/{idOrSlug}',
    handler: function (request, reply) {
      gameController.update(request)
      .then(function (res) {
        if (res.uri) {
          return reply(res.body).redirect(res.uri);
        }
        return reply(res.body);
      })
      .catch(function (err) {
        reply(utils.returnError(err));
      });
    },
    config: {
      validate: {
        payload: gameSchema
      }
    }
  });
};
