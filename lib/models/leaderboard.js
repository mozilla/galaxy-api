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
 * @param {String} member
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
 * @param {String} member
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
 * Ranks a member in the leaderboard.
 *
 * @param {String} member
 * @param {Number} score
 * @returns {Promise}
 * @api public
 */
proto.add = function (member, score) {
  return app.redis.zadd([this.slug, score, member]);
};


/**
 * Increments the score of a member by provided value and
 * ranks it in the leaderboard. Decrements if the
 * provided value is negative.
 *
 * @param {String} member
 * @param {Number} score
 * @returns {Promise}
 * @api public
 */
proto.incr = function (member, score) {
  return app.redis.zincrby([this.slug, score, member]);
};


/**
 * Retrieves the rank for a member in the leaderboard.
 *
 * @param {String} member
 * @returns {Promise}
 * @api public
 */
proto.rank = function (member) {
  var cmd = this.reverse ? app.redis.zrank : app.redis.zrevrank;
  return cmd([this.slug, member]).then(function (rank) {
    if (rank === null) {
      return -1;
    }
    return +rank;
  });
};


/**
 * Retrieves the score for a member in the leaderboard.
 *
 * @param {String} member
 * @returns {Promise}
 * @api public
 */
proto.score = function (member) {
  return app.redis.zscore([this.slug, member]).then(function (score) {
    if (score === null) {
      return -1;
    }
    return +score;
  });
};


/**
 * Removes a member from the leaderboard.
 *
 * @param {String} member
 * @returns {Promise}
 * @api public
 */
proto.rm = function (member) {
  return app.redis.zrem([this.slug, member]).then(function (num) {
    return !!num;
  });
};


/**
 * Retrieves a page of members from the leaderboard.
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
        'member': range[i],
        'score': range[i+1]
      });
    }
    return list;
  });
};


/**
 * Retrieves a member on the specified rank.
 *
 * @param {Number} rank
 * @returns {Promise}
 * @api public
 */
proto.at = function (rank) {
  var cmd = this.reverse ? app.redis.zrange : app.redis.zrevrange;
  var req = [this.slug, rank, rank, 'WITHSCORES'];

  return cmd(req).then(function (range) {
    return new Promise(function (resolve, reject) {
      if (!range.length) {
        return resolve(null);
      }

      return resolve({
        member: range[0],
        score: +range[1]
      });
    });
  });
};


/**
 * Retrieves the total number of members in the leaderboard.
 *
 * @returns {Promise}
 * @api public
 */
proto.total = function () {
  return app.redis.zcard(this.slug);
};

module.exports = Leaderboard;
