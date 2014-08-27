var Promise = require('es6-promise').Promise;

var app = require('../..').app;
var utils = require('../../lib/utils');


// TODO: Upstream Promise/Redis changes to https://github.com/borbit/node-leaderboard

/**
 * Manages CRUD for Leaderboard objects.
 *
 * @param {Object} options
 * @param {Object} redis
 */
function Leaderboard(options, redis) {
  this.options = options || {};
  this.pageSize = options.pageSize || 50;
  this.reverse = options.reverse || false;

  ['game', 'slug', 'payload', 'pageSize', 'reverse'].forEach(function (key) {
    if (key in options) {
      this[key] = options[key];
    }
  }.bind(this));
}


var proto = Leaderboard.prototype;


/**
 * Saves the leaderboard.
 *
 * @param {String} user
 * @param {Number} score
 * @returns {Promise}
 * @api public
 */
proto.save = function () {
  return app.redis.hset('game:' + this.game, this.slug, JSON.stringify(this.payload));
};


/**
 * Updates the values in the leaderboard.
 *
 * @param {String} user
 * @param {Number} score
 * @returns {Promise}
 * @api public
 */
proto.update = function (data) {
  // TODO: Handle if slug changes.
  return app.redis.hget('game:' + this.game, this.slug).then(function (existingData) {
    existingData = JSON.parse(existingData);

    data = utils.extend(data, existingData);

    return app.redis.hset('game:' + this.game, this.slug, JSON.stringify(data));
  });
};


/**
 * Ranks a user in the leaderboard.
 *
 * @param {String} user
 * @param {Number} score
 * @returns {Promise}
 * @api public
 */
proto.add = function (user, score) {
  return app.redis.zadd([this.slug, score, user]);
};


/**
 * Increments the score of a user by provided value and
 * ranks it in the leaderboard. Decrements if the
 * provided value is negative.
 *
 * @param {String} user
 * @param {Number} score
 * @returns {Promise}
 * @api public
 */
proto.incr = function (user, score) {
  return app.redis.zincrby([this.slug, score, user]);
};


/**
 * Retrieves the rank for a user in the leaderboard.
 *
 * @param {String} user
 * @returns {Promise}
 * @api public
 */
proto.rank = function (user) {
  var cmd = this.reverse ? app.redis.zrank : app.redis.zrevrank;
  return cmd([this.slug, user]).then(function (rank) {
    if (rank === null) {
      return -1;
    }
    return +rank;
  });
};


/**
 * Retrieves the score for a user in the leaderboard.
 *
 * @param {String} user
 * @returns {Promise}
 * @api public
 */
proto.score = function (user) {
  return app.redis.zscore([this.slug, user]).then(function (score) {
    if (score === null) {
      return -1;
    }
    return +score;
  });
};


/**
 * Removes a user from the leaderboard.
 *
 * @param {String} user
 * @returns {Promise}
 * @api public
 */
proto.rm = function (user) {
  return app.redis.zrem([this.slug, user]).then(function (num) {
    return !!num;
  });
};


/**
 * Retrieves a page of users from the leaderboard.
 *
 * Scores are ranked from the highest to the lowest score.
 *
 * @param {Number} page
 * @returns {Promise}
 * @api public
 */
proto.list = function (page) {
  if (typeof page === 'undefined') {
    page = 0;
  }

  var req = [
    this.slug,
    page * this.pageSize,
    page * this.pageSize + this.pageSize - 1,
    'WITHSCORES'
  ];

  var cmd = this.reverse ? app.redis.zrange : app.redis.zrevrange;

  return cmd(req).then(function (range) {
    var list = [];
    for (var i = 0; i < range.length; i += 2) {
      list.push({
        'user': range[i],
        'score': range[i+1]
      });
    }
    return list;
  });
};


/**
 * Retrieves a user on the specified rank.
 *
 * @param {Number} rank
 * @returns {Promise}
 * @api public
 */
proto.at = function (rank) {
  var cmd = this.reverse ? app.redis.zrange : app.redis.zrevrange;
  var req = [this.slug, rank, rank, 'WITHSCORES'];

  return cmd(req).then(function (range) {
    if (!range.length) {
      return null;
    }

    return {
      user: range[0],
      score: +range[1]
    };
  });
};


/**
 * Retrieves the total number of users in the leaderboard.
 *
 * @returns {Promise}
 * @api public
 */
proto.total = function () {
  return app.redis.zcard(this.slug);
};

module.exports = Leaderboard;
