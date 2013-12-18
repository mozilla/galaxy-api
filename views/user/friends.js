var auth = require('../../lib/auth');
var db = require('../../db');
var user = require('../../lib/user');


module.exports = function(server) {
    server.get({
        url: '/user/friends',
        validation: {
            user: {
                description: 'A user's,
                isRequired: true
            }
        }
    }, db.redisView(function(client, done, req, res) {
        var GET = req.params;

        var user = POST.user;
        var email;
        if (!user || !(email = auth.verifySSA(user))) {
            res.json(403, {error: 'bad_user'});
        }
        
        user.getUserIDFromEmail(email, function(err, id) {
            if (err || !id) {
                res.json(500, {error: err || 'db_eror'});
                return;
            }
            client.smembers('friends:' + id, function(err, friends) {
                if (err || !friends) {
                    res.json(500, {error: 'no_friends'});
                    return;
                }
                user.getPublicUserObjList(client, friends, function(objs) {
                    done();
                    res.json(objs);
                });
            });
        });
    }));
    
    
    // Sample usage:
    // % curl -X POST 'http://localhost:5000/user/friends' -d 'user=ssatoken&recipient=uid'
    server.post({
        url: '/user/friends/request',
        swagger: {
            nickname: 'friends',
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

        var user = POST.user;
        var email;
        if (!user || !(email = auth.verifySSA(user))) {
            res.json(403, {error: 'bad_user'});
            return;
        }

        // TODO: Accept ID *or* slug.
        var game = POST.game;
        if (!game) {
            res.json(403, {error: 'bad_game'});
            return;
        }

        var redisClient = db.redis();
        user.getUserIDFromEmail(redisClient, email, function(err, id) {
            if (err || !id) {
                redisClient.end();
                res.json(400, {error: err || 'no_user_found'});
                return;
            }
            redisClient.sadd('gamesPurchased:' + id, game, function(err) {
                redisClient.end();
                if (err) {
                    res.json(500, {error: 'internal_db_error'});
                    return;
                }
                res.json({success: true});
            });
        });
    });
};
