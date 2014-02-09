var db = require('../db');
var user = require('../lib/user');


function isLeaderboard(client, game, board, callback) {
    client.hexists('leaderboards:' + game, board, function(err, reply) {
        callback(!err && reply);
    });
}
exports.isLeaderboard = isLeaderboard;


function updateLeaderboard(client, game, board, user, value) {
    client.sismember('gamesPurchased:' + user, game, function(err, reply) {
        if (!err && reply) {
            conn.zincrby(
                'leaderboards:' + game + ':' + board,
                value,
                user
            );
        }
    });
}
exports.updateLeaderboard = updateLeaderboard;


function boardParams(game, board, sortDesc, page, limit, email) {
    var start = page * limit;
    var end = start + limit - 1;

    return {key: 'leaderboards:' + game + ':' + board,
            zRangeFunc: sortDesc ? 'zrevrange' : 'zrange',
            start: start,
            stop: end,
            email: email};
}
exports.boardParams = boardParams;


function jsonResult(client, result, callback) {
    if(!result || result.length == 0) {
        callback(null, []);
        return;
    }

    var realResult = {};
    var userIds = [];
    for (var i = 0; i < result.length; i += 2) {
        userIds.push(result[i]);
        realResult[result[i]] = result[i + 1];
    }

    user.getPublicUserObjList(client, userIds, function(objs) {
        callback(null, objs.map(function(obj) {
            return {user: obj, score: realResult[obj.id]};
        }));
    });
}
exports.jsonResult = jsonResult;


function getLeaderboard(client, params, callback) {
    var arguments = [params.key, params.start, params.stop, 'WITHSCORES'];
    client[params.zRangeFunc](arguments, function(err, result) {
        if (err) {
            callback('db_error');
            return;
        }

        jsonResult(client, result, function(err, result) {
            if (err) {
                callback('db_error');
            } else {
                callback(null, result);
            }
        });
    });
}
exports.getLeaderboard = getLeaderboard;


function getFriendsLeaderboard(client, params, callback) {
    user.getUserIDFromEmail(client, params.email, function(err, id) {
        if (err) {
            callback(err);
            return;
        }

        var randomValue = Math.floor(Math.random() * 10000);
        var interstoreKey = params.key + ':' + id + ':' + randomValue;
        var friendsKey = 'friends:' + id;

        var multi = client.multi();
        // Create a temporary zset, containing only the scores of the user's friends
        multi.zinterstore(interstoreKey, 2, params.key, friendsKey, 'AGGREGATE', 'MAX');

        // Retrieve the scores from the temp zset
        multi[params.zRangeFunc](interstoreKey, params.start, params.stop, 'WITHSCORES');

        // Remove the temp zset
        multi.del(interstoreKey);

        // Execute the above mult command in an atomic fashion
        multi.exec(function(err, reply) {
            if (err) {
                callback('db_error');
                return;
            } 

            jsonResult(client, reply[1], function(err, result) {
                if (err) {
                    callback('db_error');
                } else {
                    callback(null, result);
                }
            })
        });
    });
}
exports.getFriendsLeaderboard = getFriendsLeaderboard;
