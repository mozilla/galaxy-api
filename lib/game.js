var _ = require('lodash');
var uuid = require('node-uuid');

var utils = require('./utils');


function newGame(client, data) {
    data.id = uuid.v4();
    client.hset('games', data.id, JSON.stringify(data));
    client.hset('gamesBySlug', data.slug, data.id);
    return data;
}
exports.newGame = newGame;


function updateGame(client, data, opts) {
    var newData = _.extend(_.clone(data), opts);
    // Only update the modified timestamp if anything but the lastLogin
    // timestamp has changed.
    if (!_.isEqual(_.omit(data, 'dateLastLogin'),
                   _.omit(newData, 'dateLastLogin'))) {
        newData.datelastModified = utils.now();
    }
    client.hset('games', newData.id, JSON.stringify(newData));
    if (data.slug !== newData.slug) {
        client.hset('gamesBySlug', newData.slug, newData.id);
    }
    // TODO: Remove old hashes.
    return newData;
}
exports.updateGame = updateGame;


function getGameFromID(client, id, callback) {
    /*
    `callback` is called with an error parameter and a parameter
    containing a JSON blob of game data.
    */
    client.hget('games', id, function(err, resp) {
        if (err) {
            callback('db_error');
        } else if (!resp) {
            callback('no_such_game');
        } else {
            callback(null, JSON.parse(resp));
        }
    });
}
exports.getGameFromID = getGameFromID;


function getGameFromSlug(client, slug, callback) {
    getGameIDFromSlug(client, slug, function(err, id) {
        if (err && err !== 'no_such_game') {
            callback(err);
        } else if (!id) {
            callback(null, null);
        } else {
            getGameFromID(client, id, callback);
        }
    });
}
exports.getGameFromSlug = getGameFromSlug;


function getGameIDFromSlug(client, slug, callback) {
    client.hget('gamesBySlug', slug, function(err, resp) {
        if (err) {
            callback('db_error');
        } else if (!resp) {
            callback('no_such_game');
        } else {
            // `resp` is the game ID.
            callback(null, resp);
        }
    });
}
exports.getGameIDFromSlug = getGameIDFromSlug;


function publicGameObj(full) {
    // TODO: Update `views/game/detail.js` to return this instead of from
    // flat file.
    return _.pick(full, [
        'app_url',
        'appcache_path',
        'created',
        'default_locale',
        'description',
        'developer_name',
        'developer_url',
        'fullscreen',
        'genre',
        'homepage_url',
        'icons',
        'license',
        'locales',
        'name',
        'orientation',
        'privacy',
        'screenshots',
        'slug'
    ]);
}
exports.publicGameObj = publicGameObj;

function getPublicGameObj(client, id, callback) {
    // `callback` is called with a single parameter, which is either
    // the public game object or `null`.
    client.hget('games', id, function(err, resp) {
        if (err || !resp) {
            callback(null);
            return;
        }
        try {
            callback(publicGameObj(JSON.parse(resp)));
        } catch(e) {
            callback(null);
        }
    });
}
exports.getPublicGameObj = getPublicGameObj;


function getPublicGameObjList(client, ids, callback) {
    // `callback` is called with a single parameter, which is an
    // array of public game objects. If any result is invalid, it
    // is not included.
    if (!ids.length) {
        callback([]);
        return;
    }
    client.hmget(['games'].concat(ids), function(err, resp) {
        if (err || !resp) {
            callback(null);
            return;
        }
        callback(resp.map(function(full) {
            if (!full) return;
            try {
                return publicGameObj(JSON.parse(full));
            } catch(e) {
            }
        }).filter(_.identity);
    });
}
exports.getPublicGameObjList = getPublicGameObjList;
