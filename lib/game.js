var _ = require('lodash');
var uuid = require('node-uuid');

var utils = require('./utils');


function newGame(client, data) {
    data.id = uuid.v4();
    client.hset('games', data.id, JSON.stringify(data));

    // TODO: enforce slug uniqueness #108
    client.hset('gamesBySlug', data.slug, data.id);
    return data;
}
exports.newGame = newGame;


function updateGame(client, gameSlug, updatedGame, callback) {
    getGameFromSlug(client, gameSlug, function(err, game) {
        if (err) {
            callback(err);
        } else if (!game) {
            callback('no_such_game');
        } else {
            // Ensure that we don't change the id of the game
            updatedGame.id = game.id;
            client.hset('games', game.id, JSON.stringify(updatedGame));

            // TODO: enforce slug uniqueness #108
            if (game.slug !== updatedGame.slug) {
                client.hset('gamesBySlug', updatedGame.slug, game.id);
                client.hdel('gamesBySlug', game.slug);
            }
            callback(null, updatedGame);
        }
    });
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
    getGameFromID(client, id, function(err, resp) { 
        if (err || !resp) {
            callback(null);
            return;
        }
        try {
            callback(null, publicGameObj(resp));
        } catch(e) {
            callback(null);
        }
    });
}
exports.getPublicGameObj = getPublicGameObj;

function getGameList(client, ids, callback) {
    // `callback` is called with a single parameter, which is an
    // array of public game objects. If any result is invalid, it
    // is not included.
    if (!ids) {
        // TODO: We'll definitely need an efficient way to filter results without having
        // to fetch *every* game from the db (probably by creating sets for each property
        // we're interested in frequently filtering by)
        client.hvals('games', handleResults);
    } else {
        client.hmget(['games'].concat(ids), handleResults);
    }
    function handleResults(err, resp) {
        if (err || !resp) {
            callback(null);
            return;
        }
        callback(resp.map(function(result) {
            if (!result) return;
            try {
                return JSON.parse(result);
            } catch(e) {
            }
        }));
    };
};
exports.getGameList = getGameList;


function getPublicGameObjList(client, ids, callback) {
    getGameList(client, ids, function(results) {
        callback(results.map(publicGameObj).filter(_.identity));
    });
}
exports.getPublicGameObjList = getPublicGameObjList;
