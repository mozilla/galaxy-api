var db = require('../../db');


module.exports = function(server) {
    // Sample usage:
    // % curl -X POST 'http://localhost:5000/user/purchase' -d 'user=3&game=9'
    server.post({
        url: '/user/purchase',
        swagger: {
            nickname: 'purchase',
            notes: 'Record that a user has purchased this game',
            summary: 'Purchase game'
        },
        validation: {
            user: {
                description: 'User (ID or username slug)',
                isRequired: true
            },
            game: {
                description: 'Game (ID or slug)',
                isRequired: true
            }
        }
    }, function(req, res) {
        var POST = req.params;

        // TODO: Accept ID *or* slug.
        var user = POST.user;
        var game = POST.game;

        // TODO: Require SSA.
        if (!user) {
            res.json(403, {error: 'bad_user'});
        }
        if (!game) {
            res.json(403, {error: 'bad_game'});
        }

        var redisClient = db.redis();
        redisClient.sadd('gamesPurchased:' + user, game, function() {
            redisClient.end();
        });

        return res.json({success: true});
    });
};
