var Promise = require('es6-promise').Promise;

var app = require('../..').app;
var errors = require('../../lib/utils/errors');
var utils = require('../../lib/utils');


/**
 * Manages Game CRUD.
 *
 * @param {Object} options
 * @param {Object} db
 */
function Game() {
}


/**
 * Returns a game model.
 *
 * @param {Object} gameData An object representing the game data.
 * @api public
 */
Game.model = function Model(gameData) {
  this.data = gameData;
};


/**
 * Returns a list of all games.
 *
 * @returns {Promise}
 * @api public
 */
Game.all = function () {
  return app.redis.hvals('game').then(function (values) {
    // Return an array of all games.
    // TODO: Return an object with paginated results and metadata.
    return values.map(JSON.parse);
  });
};


/**
 * Creates a new game.
 *
 * @param {Object} data The data to instantiate the game with.
 * @returns {Promise}
 * @api public
 */
Game.create = function (data) {
  return new Promise(function (resolve, reject) {
    return app.redis.hexists('game', data.slug).then(function (val) {
      if (val === 1) {
        // Bail if slug is already taken.
        return reject("Duplicate entry '" + data.slug + "' for key 'slug'");
      }

      return app.redis.hset('game', data.slug, JSON.stringify(data))
      .then(function () {
        resolve();
      });
    }.bind(this));
  }.bind(this));
};


/**
 * Gets a game.
 *
 * @param {Object} data The attributes to look up the object by.
 * @returns {Promise}
 * @api public
 */
Game.get = function (data) {
  return new Promise(function (resolve, reject) {
    if (!('slug' in data)) {
      return reject(errors.ValidationError('"data" must contain "slug"'));
    }

    return app.redis.hget('game', data.slug).then(function (gameData) {
      if (gameData === null) {
        return reject(errors.DoesNotExist());
      }

      // Deserialise.
      gameData = JSON.parse(gameData);

      resolve(new Game.model(gameData));
    }).catch(function (err) {
      reject(errors.DatabaseError(err));
    });
  }.bind(this));
};


/**
 * Deletes a game.
 *
 * @param {Object} game The model instance of the game.
 * @returns {Promise}
 * @api public
 */
Game.delete = function (game) {
  return new Promise(function (resolve, reject) {
    if (!(game instanceof Game.model)) {
      return reject(errors.DoesNotExist('Expected to be passed a Game instance'));
    }

    return app.redis.hdel('game', game.data.slug)
    .then(resolve);
  }.bind(this));
};


/**
 * Updates a game.
 *
 * @param {Object} game The model instance of the game.
 * @param {Object} payload The fields to update on the game.
 * @returns {Promise}
 * @api public
 */
Game.update = function (game, payload) {
  return new Promise(function (resolve, reject) {
    if (!(game instanceof Game.model)) {
      return reject(
        errors.DoesNotExist('Expected to be passed a Game instance'));
    }

    var gameData = game.data;

    // Deserialise.
    var newGameData = {};

    // Add the old data.
    Object.keys(gameData).forEach(function (key) {
      newGameData[key] = gameData[key];
    });

    // Replace the old data with the new data.
    Object.keys(payload).forEach(function (key) {
      newGameData[key] = payload[key];
    });

    // If the new slug is different than the old slug, delete the old game.
    if (newGameData.slug !== gameData.slug) {
      return app.redis.hdel('game', gameData.slug).then(function () {
        resolve(newGameData);
      });
    } else {
      resolve(newGameData);
    }
  }.bind(this)).then(function (data) {
    return app.redis.hset('game', data.slug, JSON.stringify(data));
  }.bind(this));
};


module.exports.Game = Game;
