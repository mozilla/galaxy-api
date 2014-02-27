// TODO: Update prefill script to include genre
var db = require('../../db');
var genre = require('../../lib/genre');


module.exports.getGenreList =
    db.redisView(function(client, done, req, res, wrap) {
        client.hvals('genre', db.plsNoError(res, done, function(genres) {
            res.json(genres.map(JSON.parse));
            done();
        }));
    });

module.exports.postNewGenre =
    db.redisView(function(client, done, req, res, wrap) {
        var DATA = req.params;

        var slug = DATA.slug;
        var data = {
            name: DATA.name,
            slug: slug
        };

        genre.hasGenre(client, slug, db.plsNoError(res, done, function(exists) {
            if (exists) {
                res.json(400, {error: 'genre_slug_exists'});
                done();
            } else {
                client.hset('genre', slug, JSON.stringify(data), db.plsNoError(res, done, function(reply) {
                    res.json({success: true});
                    done();
                })); 
            }
        }));
    });

module.exports.delGenre =
    db.redisView(function(client, done, req, res, wrap) {
        var DATA = req.params;

        var slug = DATA.slug;

        client.hdel('genre', slug, db.plsNoError(res, done, function(reply) {
            if (reply) {
                res.json({success: true});
            } else {
                res.json(400, {error: 'no_such_genre'});
            }
            done();
        }));
    });
