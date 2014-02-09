var _ = require('lodash');

var auth = require('../../lib/auth');
var db = require('../../db');
var user = require('../../lib/user');


module.exports = function(server) {
    // Sample usage:
    // % curl 'http://localhost:5000/game/mario-bros/board'
    server.get({
        url: '/game/:game/board',
        swagger: {
            nickname: 'get-board',
            notes: 'Returns a list of the leaderboards boards that are ' +
                   'available for a particular game.',
            summary: 'List of Leaderboards for a Game'
        }
    }, db.redisView(function(client, done, req, res, wrap) {
        var DATA = req.params;

        // TODO: Check for valid game.
        // https://github.com/cvan/galaxy-api/issues/57
        var game = DATA.game;
        if (!game) {
            res.json(400, {error: 'bad_game'});
            done();
            return;
        }

        // TODO: wrap
        client.hvals('leaderboards:' + game, function(err, boards) {
            if (err) {
                res.json(400, {error: true});
                done();
                return;
            }

            // TODO: Consider returning the default output of the board
            boards = boards.map(JSON.parse);
            res.json(boards);
            done();
        });
    }));

    // Sample usage:
    // % curl -X POST 'http://localhost:5000/game/mario-bros/board' -d 'name=Warios Smashed&slug=warios-smashed'
    server.post({
        url: '/game/:game/board',
        swagger: {
            nickname: 'create-board',
            notes: 'Creates a leaderboard board for a particular game.',
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
        // https://github.com/cvan/galaxy-api/issues/67        
        var game = DATA.game;
        if (!game) {
            res.json(400, {error: 'bad_game'});
            done();
            return;
        }

        var data = {
            name: name,
            slug: slug
        };

        // TODO: wrap
        client.hset('leaderboards:' + game, slug, JSON.stringify(data), function(err, reply) {
            if (err) {
                res.json(400, {error: true});
            } else {
                res.json({success: true});
            }
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
        // https://github.com/cvan/galaxy-api/issues/57
        var game = DATA.game;
        if (!game) {
            res.json(400, {error: 'bad_game'});
            done();
            return;
        }

        // TODO: wrap
        client.hdel('leaderboards:' + game, slug, function(err, reply) {
            if (err) {
                res.json(400, {error: true});
            } else {
                res.json({success: true});
            }
            done();
        });
    }));

    // Sample usage:
    // % curl 'http://localhost:5000/game/mario-bros/board/warios-smashed'
    // % curl 'http://localhost:5000/game/mario-bros/board/warios-smashed?sort=asc&friendsOnly=true&_user=ssa_token'
    server.get({
        url: '/game/:game/board/:board',
        swagger: {
            nickname: 'get-scores',
            notes: 'Returns the list of scores of a particular leaderboard',
            summary: 'List of Scores for LeaderBoard'
        },
        validation: {
            sort: {
                description: 'Sort order',
                isAlpha: true,
                isRequired: false
            },
            friendsOnly: {
                description: 'Only show score of friends',
                isRequired: false
            },
            _user: {
                description: 'User (ID or username slug)',
                isRequired: false
            },
            page: {
                description: 'Page number',
                isInt: true,
                isRequired: false
            },
            limit: {
                description: 'Number of results per page',
                isInt: true,
                isRequired: false
            }
        }
    }, db.redisView(function(client, done, req, res, wrap) {
        var DATA = req.params;

        // TODO: Check for valid game. 
        // https://github.com/cvan/galaxy-api/issues/57
        var game = DATA.game;
        if (!game) {
            res.json(400, {error: 'bad_game'});
            done();
            return;
        }

        // TODO: Check for valid leaderboard
        // https://github.com/cvan/galaxy-api/issues/57
        var board = DATA.board;
        if (!board) {
            res.json(400, {error: 'bad_board'});
            done();
            return;            
        }

        var sortDesc = DATA.sort !== 'asc';

        var friendsOnly = DATA.friendsOnly;
        var _user = DATA._user;
        var email;

        // TODO: Verify the default limits
        // https://github.com/cvan/galaxy-api/issues/67
        var page = DATA.page ? parseInt(DATA.page, 10) : 0;
        var limit = DATA.limit ? parseInt(DATA.limit, 10) : 10;

        var start = page * limit;
        var stop = start + limit - 1;

        if (friendsOnly) {
            if (!_user) {
                res.json(403, {error: 'missing_user'});
                done();
                return;
            } else if (!(email = auth.verifySSA(_user))) {
                res.json(403, {error: 'bad_user'});
                done();
                return;
            }
        }

        function outputResult(result) {
            if(!result || result.length == 0) {
                res.json([]);
                done();
                return;
            }

            var realResult = {};
            var userIds = [];
            for (var i = 0; i < result.length; i += 2) {
                userIds.push(result[i]);
                realResult[result[i]] = result[i + 1];
            }

            user.getPublicUserObjList(client, userIds, function(objs) {
                res.json(objs.map(function(obj) {
                    return {user: obj, score: realResult[obj.id]};
                }));
                done();
            });
        }

        var key = 'leaderboards:' + game + ':' + board;
        var zRangeFunc = sortDesc ? 'zrevrange' : 'zrange';

        if (friendsOnly) {
            user.getUserIDFromEmail(client, email, db.plsNoError(res, done, function(id) {
                var randomValue = Math.floor(Math.random() * 10000);
                var interstoreKey = key + ':' + id + ':' + randomValue;
                var friendsKey = 'friends:' + id;

                var multi = client.multi();
                // Create a temporary zset, containing only the scores of the user's friends
                multi.zinterstore(interstoreKey, 2, key, friendsKey, 'AGGREGATE', 'MAX');

                // Retrieve the scores from the temp zset
                multi[zRangeFunc](interstoreKey, start, stop, 'WITHSCORES');

                // Remove the temp zset
                multi.del(interstoreKey);

                // Execute the above mult command in an atomic fashion
                multi.exec(db.plsNoError(res, done, function(reply) {
                    outputResult(reply[1]);
                }));
            }));
        } else {
            var arguments = [key, start, stop, 'WITHSCORES'];
            client[zRangeFunc](arguments, db.plsNoError(res, done, function(scores) {
                outputResult(scores);
            }));
        }
    }));
}
