var _ = require('lodash');

var db = require('../../db');
var gamelib = require('../../lib/game');
var user = require('../../lib/user');


module.exports = function(server) {
    // Sample usage:
    // % curl 'http://localhost:5000/game/mario-bros/detail'
    server.get({
        url: '/game/:slug/detail',
        swagger: {
            nickname: 'detail',
            notes: 'Specific details and metadata about a game',
            summary: 'Game Details'
        },
        validation: {
            _user: {
                description: "A user's SSA token",
                isRequired: false
            }
        }
    }, db.redisView(function(client, done, req, res, wrap) {
        var GET = req.params;
        var slug = GET.slug;
        var email = req._email;

        if (!slug) {
            res.json(400, {error: 'bad_game'});
            done();
            return;
        }

        gamelib.getGameFromSlug(client, slug, function(err, game) {
            if (!game) {
                res.json(500, {error: 'db_error'});
                return done();
            }
            game.purchased = true;
            if (email) {
                user.getUserIDFromEmail(client, email, function(err, id) {
                    if (err) {
                        res.json(500, {error: 'user_id_db_error'});
                        return done();
                    }
                    client.sismember('gamesPurchased:' + id, slug, function(err, resp) {
                        if (err) {
                            res.json(500, {error: 'purchase_list_db_error'});
                            return done();
                        }
                        if (!resp) {
                            // game has not been purchased
                            game.purchased = false;
                        }
                        res.json(game);
                        return done();
                    });
                });
            } else {
                res.json(game);
                return done();
            }
        });
    }));
};
