var db = require('../../db');


module.exports = function(server) {
    // Sample usage:
    // % curl 'http://localhost:5000/game/genre'
    server.get({
        url: '/game/genre',
        swagger: {
            nickname: 'game-genre',
            notes: 'Get the list of genres',
            summary: 'List of game genres'
        }
    }, db.redisView(function(client, done, req, res, wrap) {
        client.hvals('gameGenre', db.plsNoError(res, done, function(genres) {
            res.json(genres.map(JSON.parse));
            done();
        }));
    }));

    // Sample usage:
    // % curl -X POST 'http://localhost:5000/game/genre' -d 'name=Action&slug=action'
    server.post({
        url: '/game/genre',
        swagger: {
            nickname: 'add-game-genre',
            notes: 'Add a new game genre',
            summary: 'Add new game genre'
        },
        validation: {
            name: {
                description: 'Genre name',
                isRequired: true
            },
            slug: {
                description: 'Genre slug',
                isRequired: true
            }
        }
    }, db.redisView(function(client, done, req, res, wrap) {
        var DATA = req.params;

        var name = DATA.name;
        var slug = DATA.slug;

        var data = {
            name: name,
            slug: slug
        };

        // TODO: Move this to a lib/genre.js when genre becomes more complicated
        (function genreSlugExists(slug, callback) {
            client.hexists('gameGenre', slug, db.plsNoError(res, done, function(reply) {
                callback(null, reply);
            }));
        })(slug, function(err, exists) {
            if (exists) {
                res.json(400, {error: 'genre_slug_exists'});
                done();
            } else {
               client.hset('gameGenre', slug, JSON.stringify(data), db.plsNoError(res, done, function(reply) {
                    res.json({success: true});
                    done();
                }));
            }
        });
    }));

    // Sample usage:
    // % curl -X DELETE 'http://localhost:5000/game/genre' -d 'slug=action'
    server.del({
        url: '/game/genre',
        swagger: {
            nickname: 'delete-genre',
            notes: 'Remove an existing game genre',
            summary: 'Delete a game genre'
        },
        validation: {
            slug: {
                description: 'Genre slug',
                isRequired: true
            }
        }
    }, db.redisView(function(client, done, req, res, wrap) {
        var DATA = req.params;

        var slug = DATA.slug;

        client.hdel('gameGenre', slug, db.plsNoError(res, done, function(reply) {
            if (reply) {
                res.json({success: true});
            } else {
                res.json(400, {error: 'no_such_genre'});
            }
            done();
        }));
    }));
};
