// TODO: Update prefill script to include genre
var db = require('../../db');
var genre = require('../../lib/genre');


module.exports = function(server) {
    // Sample usage:
    // % curl 'http://localhost:5000/genre'
    server.get({
        url: '/genre',
        swagger: {
            nickname: 'genre',
            notes: 'Get the list of genres',
            summary: 'List of game genres'
        }
    }, db.redisView(function(client, done, req, res, wrap) {
        client.hvals('genre', db.plsNoError(res, done, function(genres) {
            res.json(genres.map(JSON.parse));
            done();
        }));
    }));

    // Sample usage:
    // % curl -X POST 'http://localhost:5000/genre' -d 'name=Action&slug=action'
    server.post({
        url: '/genre',
        swagger: {
            nickname: 'add-genre',
            notes: 'Add a new game genre',
            summary: 'Add new game genre'
        },
        validation: {
            name: {
                description: 'Genre name',
                isRequired: true
            },
            slug: {
                description: 'Genre slug',
                isRequired: true
            }
        }
    }, db.redisView(function(client, done, req, res, wrap) {
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
    }));

    // Sample usage:
    // % curl -X DELETE 'http://localhost:5000/genre' -d 'slug=action'
    server.del({
        url: '/genre',
        swagger: {
            nickname: 'delete-genre',
            notes: 'Remove an existing game genre',
            summary: 'Delete a game genre'
        },
        validation: {
            slug: {
                description: 'Genre slug',
                isRequired: true
            }
        }
    }, db.redisView(function(client, done, req, res, wrap) {
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
    }));
};
