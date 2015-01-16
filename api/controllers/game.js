'use strict';

var Joi = require('joi');

var Game = require('../models/game');
var utils = require('../../lib/utils');


var gameSchema = {
  // Game Description is optional.
  description: Joi.string().example('Mario Bros. is a sweet adventure game.'),

  // Game URL must start with `https://` or `http://`.
  game_url: Joi.string().regex(/^https?:\/\//).required()
               .example('http://nintendo.com/mario-bros/'),

  // Game Name cannot be longer than 150 characters long.
  name: Joi.string().max(150).required()
           .example('Mario Bros.'),

  // Game Slug cannot be all digits, all underscores, or all hyphens
  // and must contain only letters, numbers, underscores, and hyphens.
  // TODO: Throw an error if `slug` is already taken.
  slug: Joi.string().regex(/^(?!\d*$)(?!_*$)(?!-*$)[\w-]+$/).required()
  .example('mario-bros')
};


// This wraps the handlers and calls the following for each the promise
// returned by the controller handlers:
//
//   …
//   .catch(function (err) {
//
//     reply(utils.returnError(err));
//   });
//
var safeHandler = function (func) {

  return function (request, reply) {

    func.apply(this, arguments).catch(function (err) {

      reply(utils.returnError(err));
    });
  };
};


exports.all = {
  handler: safeHandler(function (request, reply) {

    return Game.objects.all(request.params)
    .then(function (games) {

      reply(games.map(Game.getPublicObj));
    });
  })
};


exports.create = {
  validate: {
    payload: gameSchema
  },
  handler: safeHandler(function (request, reply) {

    return Game.objects.create(request.payload)
    .then(function (res) {

      var body = Game.getPublicObj(res.body);
      var uri = res.uri;

      reply(body).created(uri);
    });
  })
};


exports.get = {
  handler: safeHandler(function (request, reply) {

    return Game.objects.get(request.params)
    .then(function (game) {

      reply(Game.getPublicObj(game));
    });
  })
};


exports.remove = {
  handler: safeHandler(function (request, reply) {

    return Game.objects.remove(request.params)
    .then(reply);
  })
};


exports.update = {
  validate: {
    payload: gameSchema
  },
  handler: safeHandler(function (request, reply) {

    return Game.objects.update(request.params, request.payload)
    .then(function (res) {

      var body = Game.getPublicObj(res.body);
      var uri = res.uri;

      if (uri) {
        return reply(body).redirect(uri);
      }

      reply(body);
    });
  })
};
