var hapi = require('hapi');

var joi = require('joi');

var gameController = require('./controllers/game.js');


module.exports = function (server) {
  server.route({
    method: 'GET',
    path: '/games',
    handler: function (request, reply) {
      reply(gameController.get(request));
    }
  });

  server.route({
    method: 'POST',
    path: '/games',
    handler: function (request, reply) {
      reply(gameController.create(request));

      // request.reply(product).code(201).header('Location', '/products/' + product.id);
    },
    config: {
      validate: {
        payload: {
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
        }
      }
    }
  });

  // TODO: Throw error if neither `/games/{id}` nor `/games/{slug}` resolves.
  server.route({
    method: 'GET',
    path: '/games/{idOrSlug}',
    handler: function (request, reply) {
      reply(gameController.get(request));
    },
    config: {
      validate: {
        params: {
          // // Game Slug cannot be all digits, all underscores, or all hyphens
          // // and must contain only letters, numbers, underscores, and hyphens.
          // // TODO: ID *or* slug is required; enforce.
          // idOrSlug: joi.number().integer().example('9'),

          // // Game Slug cannot be all digits, all underscores, or all hyphens
          // // and must contain only letters, numbers, underscores, and hyphens.
          // // TODO: ID *or* slug is required; enforce.
          idOrSlug: joi.string().regex(/^(?!\d*$)(?!_*$)(?!-*$)[\w-]+$/)
            .example('mario-bros')
        }
      }
    }
  });
};
