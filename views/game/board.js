var _ = require('lodash');

var db = require('../../db');


module.exports = function(server) {
    // Sample usage:
    // % curl -X POST 'http://localhost:5000/game/mario-bros/board' -d 'name=Warios Smashed&slug=warios-smashed'
    server.post({
        url: '/game/:game/board',
        swagger: {
            nickname: 'create-board',
            notes: 'Returns a list of the leaderboards boards that are ' +
                   'available for a particular game.',
            summary: 'Create a Game Leaderboard'
        },
        validation: {
            name: {
                description: 'Board name',
                isRequired: true
            },
            slug: {
                description: 'Board slug',
                isRequired: true
            }
        }
    }, db.redisView(function(client, done, req, res, wrap) {
        var DATA = req.params;

        var name = DATA.name;
        var slug = DATA.slug;

        // TODO: Check for valid game.
        // TODO: Accept ID *or* slug.
        var game = DATA.game;
        if (!game) {
            res.json(400, {error: 'bad_game'});
            done();
        }

        var data = {
            name: name,
            slug: slug
        };

        // TODO: wrap
        client.hset('leaderboards:' + game, slug, JSON.stringify(data), function(err, reply) {
            if (err) {
                res.json(400, {error: true});
                done();
            }
            res.json({success: true});
            done();
        });
    }));

    // Sample usage:
    // % curl -X DELETE 'http://localhost:5000/game/mario-bros/board' -d 'slug=warios-smashed'
    server.del({
        url: '/game/:game/board',
        swagger: {
            nickname: 'delete-board',
            notes: 'Removes a leaderboard from a particular game.',
            summary: 'Delete a Game Leaderboard'
        },
        validation: {
            slug: {
                description: 'Board slug',
                isRequired: true
            }
        }
    }, db.redisView(function(client, done, req, res, wrap) {
        var DATA = req.params;

        var slug = DATA.slug;

        // TODO: Check for valid game.
        // TODO: Accept ID *or* slug.
        var game = DATA.game;
        if (!game) {
            res.json(400, {error: 'bad_game'});
            done();
        }

        // TODO: wrap
        client.hdel('leaderboards:' + game, slug, function(err, reply) {
            if (err) {
                res.json(400, {error: true});
                done();
            }
            res.json({success: true});
            done();
        });
    }));
};
