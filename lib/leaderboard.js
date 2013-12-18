var isLeaderboard = exports.isLeaderboard = function(conn, game, board) {
    return conn.sismember('leaderboards:' + game, board);
};

exports.updateLeaderboard = function(conn, game, board, user, value) {
    conn.zincrby(
        'leaderboards:' + game + ':' + board,
        value,
        user
    );
};
