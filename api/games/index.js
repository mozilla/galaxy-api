/**
 * See routes defined in `config.json`.
 */

var Joi = require('joi');
var Promise = require('es6-promise').Promise;

var db = require('../../lib/db');
var utils = require('../../lib/utils');

var games = {};  // Local cache of game data
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

  yield redis.hvals('game')
  .then(function (values) {
    // `values` is an array of serialised games.
    // Create an array of parsed games, and update the local cache.
    games = values.map(JSON.parse);

    // Return 200 with an array of all the games.
    // TODO: Return an object with paginated results and metadata.
    response.success(games);
  }).catch(response.dbError);
};


/**
 * POST a new game.
 */
exports.create = function *() {
  var payload = this.request.body;
  var response = new utils.Response(this);

  yield validate(payload, gameSchema, {abortEarly: false})
  .then(function () {
    return redis.hset('game', payload.slug, JSON.stringify(payload))
    .then(function () {
      response.success();

      // Add game to local cache.
      games[payload.slug] = payload;
    }).catch(response.dbError);
  },
  response.validationError);
};


/**
 * GET a single game.
 */
exports.get = function *() {
  var response = new utils.Response(this);
  var slug = this.params.slug;

  var game = yield redis.hget('game', slug).catch(response.dbError);

  if (game) {
    // Return 200 with game data.
    response.success(game);
  } else if (game === null) {
    // Return 404 if game slug does not exist as a key in the database.
    response.missing(game);
  }
};


function* edit(self, replace) {
  var payload = self.request.body;
  var response = new utils.Response(self);

  var oldSlug = self.params.slug;
  var newSlug = 'slug' in payload ? payload.slug : oldSlug;
  var newGameData;
  var schema = replace ? gameSchema : gameSchemaPatch;

  yield validate(payload, schema, {abortEarly: false})
  .then(function () {
    return redis.hget('game', oldSlug)
    .then(function (gameData) {
      if (gameData === null) {
        return response.missing();
      }

      if (replace) {
        newGameData = JSON.stringify(payload);
      } else {
        // Deserialise.
        newGameData = JSON.parse(gameData);

        // Replace the old keys' values with the new keys' values.
        Object.keys(payload).forEach(function (key) {
          newGameData[key] = payload[key];
        });

        // Serialise.
        newGameData = JSON.stringify(newGameData);
      }

      return redis.hset('game', newSlug, newGameData)
      .then(function () {
        if (newSlug !== oldSlug) {
          // Slug was changed, so rename keys.
          delete games[oldSlug];
          return redis.hdel('game', oldSlug);
        }
      }).then(function () {
        // Update game in local cache.
        games[payload.slug] = payload;

        response.success();
      });
    });
  },
  response.validationError).catch(response.dbError);
}


/**
 * PATCH a single game (change only the fields supplied).
 */
exports.update = function *() {
  yield edit(this);
};


/**
 * PUT a single game (replace the entire object).
 */
exports.replace = function *() {
  yield edit(this, true);
};


/**
 * DELETE a single game.
 */
exports.delete = function *() {
  var response = new utils.Response(this);
  var slug = this.params.slug;

  if (slug in games) {
    delete games[slug];
  }

  var game = yield redis.hdel('game', slug).catch(response.dbError);

  if (game) {
    // Return 200 with success.
    response.success();
  } else if (game === null) {
    // Return 404 if game slug does not exist as a key in the database.
    response.missing(game);
  }
};
