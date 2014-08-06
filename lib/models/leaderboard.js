var Promise = require('es6-promise').Promise;

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
  this.redis = redis;

  ['game', 'slug', 'payload', 'pageSize', 'reverse'].forEach(function (key) {
    this[key] = options[key];
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
  return this.redis.hset('game:' + this.game, this.slug, JSON.stringify(this.payload));
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
  return this.redis.hget('game:' + this.game, this.slug).then(function (existingData) {
    existingData = JSON.parse(existingData);

    data = utils.extend(data, existingData);

    return this.redis.hset('game:' + this.game, this.slug, JSON.stringify(data));
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
  return this.redis.zadd([this.slug, score, member]);
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
  return this.redis.zincrby([this.slug, score, member]);
};


/**
 * Retrieves the rank for a member in the leaderboard.
 *
 * @param {String} member
 * @returns {Promise}
 * @api public
 */
proto.rank = function (member) {
  var cmd = this.reverse ? this.redis.zrank : this.redis.zrevrank;
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
  return this.redis.zscore([this.slug, member]).then(function (score) {
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
  return this.redis.zrem([this.slug, member]).then(function (num) {
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

  var cmd = this.reverse ? this.redis.zrange : this.redis.zrevrange;

  return cmd(req).then(function (range) {
    return new Promise(function (resolve, reject) {
      var list = [];
      for (var i = 0; i < range.length; i += 2) {
        list.push({
          'member': range[i],
          'score': range[i+1]
        });
      }
      resolve(list);
    });
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
  var cmd = this.reverse ? this.redis.zrange : this.redis.zrevrange;
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
  return this.redis.zcard(this.slug);
};

module.exports = Leaderboard;
