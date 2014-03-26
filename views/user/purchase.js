var auth = require('../../lib/auth');
var db = require('../../db');
var user = require('../../lib/user');


module.exports = function(server) {
    // Sample usage:
    // % curl 'http://localhost:5000/user/purchase?_user=ssatoken'
    server.get({
        url: '/user/purchase',
        swagger: {
            nickname: 'get-purchase',
            notes: 'Get the list of user purchases',
            summary: 'Purchase history'
        },
        validation: {
            _user: {
                description: "A user's SSA token",
                isRequired: true
            }
        }
    }, user.userIDView(function(id, client, done, req, res) {
        client.smembers('gamesPurchased:' + id, function(err, resp) {
            if (err) {
                res.json(500, {error: 'internal_db_error'});
            } else {
                res.json(resp);
            }
            return done();
        });
    }));

    // Sample usage:
    // % curl -X POST 'http://localhost:5000/user/purchase' -d '_user=ssatoken&game=9'
    server.post({
        url: '/user/purchase',
        swagger: {
            nickname: 'purchase',
            notes: 'Record that a user has purchased this game',
            summary: 'Purchase game'
        },
        validation: {
            _user: {
                description: "A user's SSA token",
                isRequired: true
            },
            game: {
                description: 'Game (ID or slug)',
                isRequired: true
            }
        }
    }, user.userIDView(function(id, client, done, req, res) {
        var POST = req.params;

        // TODO: Accept ID *or* slug.
        var game = POST.game;
        if (!game) {
            res.json(403, {error: 'bad_game'});
            return;
        }

        client.sadd('gamesPurchased:' + id, game, function(err) {
            done();
            if (err) {
                res.json(500, {error: 'internal_db_error'});
                return;
            }
            res.json({success: true});
        });
    }));
};
