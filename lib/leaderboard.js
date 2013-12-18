var isLeaderboard = exports.isLeaderboard = function(conn, game, board, callback) {
    conn.sismember('leaderboards:' + game, board, function(err, reply) {
        callback(!err && reply);
    });
};

exports.updateLeaderboard = function(conn, game, board, user, value) {
    conn.zincrby(
        'leaderboards:' + game + ':' + board,
        value,
        user
    );
};
