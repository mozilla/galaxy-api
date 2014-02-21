var _ = require('lodash');


function genreExists(client, slug, callback) {
    client.hexists('genre', slug, function(error, reply) {
        if (error) {
            callback('db_error', null);
        } else {
            callback(null, reply);
        }
    });
}
exports.genreExists = genreExists;


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
