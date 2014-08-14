/**
 * See routes defined in `config.json`.
 */

var Joi = require('joi');
var Promise = require('es6-promise').Promise;

var db = require('../../lib/db');
var utils = require('../../lib/utils');
var Game = require('../../lib/models/game').Game;

var redis = db.redis();  // Real database for game data
var validate = utils.promisify(Joi.validate);  // Promise-based `Joi.validate`


var gameKeys = {
  // App URL must start with `https://` or `http://`.
  app_url: Joi.string().regex(/^https?:\/\//).required()
    .example('http://nintendo.com/mario-bros/'),

  // App Name cannot be longer than 150 characters long.
  name: Joi.string().max(150).required()
    .example('Mario Bros.'),

  // App Slug cannot be all digits, all underscores, or all hyphens
  // and must contain only letters, numbers, underscores, and hyphens.
  // TODO: Throw an error if `slug` is already taken.
  slug: Joi.string().regex(/^(?!\d*$)(?!_*$)(?!-*$)[\w-]+$/).required()
    .example('mario-bros')
};

// Define schema for JSON payloads. (Run `Joi.describe` to see examples.)
var gameSchema = Joi.object().keys(gameKeys).example({
  app_url: 'http://nintendo.com/mario-bros/',
  name: 'Mario Bros.',
  slug: 'mario-bros'
});


// For PATCH, use the same schema except every field is optional.
var gameKeysPatch = {};
Object.keys(gameKeys).forEach(function (key) {
  gameKeysPatch[key] = gameKeys[key].optional();
});

var gameSchemaPatch = Joi.object().keys(gameKeysPatch);


/**
 * GET all games.
 */
exports.all = function *() {
  var response = new utils.Response(this);

  yield Game.all()
  .then(response.success)
  .catch(response.dbError);
};


/**
 * POST a new game.
 */
exports.create = function *() {
  var payload = this.request.body;
  var response = new utils.Response(this);

  yield validate(payload, gameSchema, {abortEarly: false})
  .then(function () {
    return Game.create(payload)
    .then(response.success, response.validationError)
    .catch(response.dbError);
  }, response.validationError);
};


/**
 * GET a single game.
 */
exports.get = function *() {
  var response = new utils.Response(this);
  var slug = this.params.slug;

  // Return 200 with game data if the slug exists.
  yield Game.get({slug: slug})
  .then(response.success)
  .catch(function (err) {
    utils.CaughtResponse(response, err);
  });
};


/**
 * PATCH a single game (change only the fields supplied).
 */
exports.update = function *() {
  var payload = this.request.body;
  var response = new utils.Response(this);

  var oldSlug = this.params.slug;
  // Use the new slug or the old slug, depending on whether's it in the payload.
  var newSlug = 'slug' in payload ? payload.slug : oldSlug;

  yield validate(payload, gameSchemaPatch, {abortEarly: false})
  .then(function () {
    return Game.get({slug: oldSlug})
    .then(function (gameModel) {
      return Game.update(gameModel, payload);
    })
    .then(function (updateResponse) {
      // Return 200 with success.
      response.success();
    });
  }, response.validationError)
  .catch(function (err) {
    utils.CaughtResponse(response, err);
  });
};


/**
 * DELETE a single game.
 */
exports.delete = function *() {
  var response = new utils.Response(this);
  var slug = this.params.slug;

  yield Game.get({slug: slug})
  .then(function (gameModel) {
    return Game.delete(gameModel);
  })
  .then(function (deleteResponse) {
    if (deleteResponse === 1) {
      // Return 200 with success.
      response.success();
    } else {
      // Return 500 with error.
      response.dbError('Unexpected response upon deletion: ' +
        deleteResponse);
    }
  })
  .catch(function (err) {
    utils.CaughtResponse(response, err);
  });
};
