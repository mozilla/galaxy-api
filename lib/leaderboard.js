var isLeaderboard = exports.isLeaderboard = function(conn, game, board, callback) {
    conn.hexists('leaderboards:' + game, board, function(err, reply) {
        callback(!err && reply);
    });
};

exports.updateLeaderboard = function(conn, game, board, user, value) {
    conn.sismember('gamesPurchased:' + user, game, function(err, reply) {
        if (!err && reply) {
            conn.zincrby(
                'leaderboards:' + game + ':' + board,
                value,
                user
            );
        }
    });
};
