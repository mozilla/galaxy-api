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
            var hasAllGenres = true;
            genres.forEach(function(genre) {
                if (!allGenres[genre]) {
                    hasAllGenres = false;
                }
            });
            callback(null, hasAllGenres);
        }
    });
}
exports.hasGenres = hasGenres;
