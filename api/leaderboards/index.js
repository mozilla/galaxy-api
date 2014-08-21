/**
 * See routes defined in `config.json`.
 */

var Joi = require('joi');
var Promise = require('es6-promise').Promise;

var app = require('../..').app;
var utils = require('../../lib/utils');
var Leaderboard = require('../../lib/models/leaderboard');

var validate = utils.promisify(Joi.validate);  // Promise-based `Joi.validate`


var boardKeys = {
  // Leaderboard Name cannot be longer than 150 characters long.
  name: Joi.string().max(150).required()
    .example('Mario Bros.'),

  // Leaderboard Slug cannot be all digits, all underscores, or all hyphens
  // and must contain only letters, numbers, underscores, and hyphens.
  // TODO: Throw an error if `slug` is already taken for this game.
  slug: Joi.string().regex(/^(?!\d*$)(?!_*$)(?!-*$)[\w-]+$/).required()
    .example('mario-bros')
};
var boardSchema = Joi.object().keys(boardKeys);


// For PATCH, use the same schema except every field is optional.
var boardKeysPatch = {};
Object.keys(boardKeys).forEach(function (key) {
  boardKeysPatch[key] = boardKeys[key].optional();
});

var boardSchemaPatch = Joi.object().keys(boardKeysPatch);


/**
 * GET all leaderboards.
 */
exports.all = function *() {
  var response = new utils.Response(this);
  var gameSlug = this.params.game_slug;

  yield app.redis.hvals('game:' + gameSlug).then(function (values) {
    // Return 200 with an array of all the leaderboards.
    // TODO: Return an object with paginated results and metadata.
    response.success(values.map(JSON.parse));
  }).catch(response.dbError);
};


/**
 * POST a new leaderboard.
 */
exports.create = function *() {
  var response = new utils.Response(this);
  var payload = this.request.body;
  var gameSlug = this.params.game_slug;

  // TODO: Validate game by its slug (issue #225).

  yield validate(payload, boardSchema, {abortEarly: false}).then(function () {
    return new Leaderboard({
      game: gameSlug,
      slug: payload.slug,
      payload: payload
    }).save();
  }).catch(response.dbError).then(function () {
    response.success();
  }, response.validationError);
};


/**
 * GET a single leaderboard.
 */
exports.get = function *() {
  var response = new utils.Response(this);
  var gameSlug = this.params.game_slug;
  var boardSlug = this.params.board_slug;

  var game = yield app.redis.hget('game:' + gameSlug, boardSlug)
  .catch(response.dbError);

  // TODO: Validate game by its slug (issue #225).

  if (game) {
    // Return 200 with leaderboard data.
    response.success(game);
  } else if (game === null) {
    // Return 404 if leaderboard slug does not exist as a key in the database.
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

  function editSuccess() {
    response.success();
  }

  // TODO: Validate game by its slug (issue #225).

  yield validate(payload, schema, {abortEarly: false})
  .then(function () {
    return app.redis.hget('game', oldSlug)
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

      return app.redis.hset('game', newSlug, newGameData)
      .then(function () {
        if (newSlug !== oldSlug) {
          // Slug was changed, so rename keys.
          return app.redis.hdel('game', oldSlug);
        }
      }).then(function () {
        response.success();
      });
    });
  },
  response.validationError).catch(response.dbError);
}


/**
 * PATCH a single leaderboard (change only the fields supplied).
 */
exports.update = function *() {
  yield edit(this);
};


/**
 * PUT a single leaderboard (replace the entire object).
 */
exports.replace = function *() {
  yield edit();
};


/**
 * DELETE a single leaderboard.
 */
exports.delete = function *() {
  var response = new utils.Response(this);
  var gameSlug = this.params.game_slug;
  var boardSlug = this.params.board_slug;

  yield app.redis.hexists('game:' + gameSlug, boardSlug).then(function (board) {
    if (!board) {
      return response.missing(board);
    }

    return app.redis.hdel('game:' + gameSlug, boardSlug).then(function () {
      response.success();
    });
  }).catch(response.dbError);
};


/**
 * GET all leaderboard scores.
 */
exports.scores_all = function *() {
  // TODO: Allow filtering by user.
  yield new Promise();
};


/**
 * POST a new score to a leaderboard.
 */
exports.scores_create = function *() {
  // TODO: Add score schema.
  // TODO: Accept user and score.
  // TODO: Add User API endpoints.
  yield new Promise();
};


/**
 * GET a single score from a leaderboard.
 */
exports.scores_get = function *() {
  yield new Promise();
};


/**
 * PATCH a single score (change only the fields supplied).
 */
exports.scores_update = function *() {
  yield new Promise();
};


/**
 * DELETE a single score.
 */
exports.scores_delete = function *() {
  yield new Promise();
};
