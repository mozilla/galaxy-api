function getAllGenres(client, callback) {
    client.hgetall('genre', function(error, genres) {
        if (error) {
            callback('db_error', null);
        } else {
            callback(null, genres);
        }
    });
}
exports.getAllGenres = getAllGenres;


function hasGenre(client, slug, callback) {
    client.hexists('genre', slug, function(error, reply) {
        if (error) {
            callback('db_error', null);
        } else {
            callback(null, reply);
        }
    });
}
exports.hasGenre = hasGenre;


function hasGenres(client, genres, callback) {
    getAllGenres(client, function(error, allGenres) {
        if (error) {
            callback('db_error', null);
        } else {
            for (var i = 0; i < genres.length; i++) {
                var genre = genres[i];
                if (!allGenres[genre]) {
                    callback(null, false);
                }
            }
            callback(null, true);
        }
    });
}
exports.hasGenres = hasGenres;
