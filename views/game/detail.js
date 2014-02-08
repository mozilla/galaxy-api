var _ = require('lodash');

var db = require('../../db');
var gamelib = require('../../lib/game');


module.exports = function(server) {
    // Sample usage:
    // % curl 'http://localhost:5000/game/mario-bros/detail'
    server.get({
        url: '/game/:slug/detail',
        swagger: {
            nickname: 'detail',
            notes: 'Specific details and metadata about a game',
            summary: 'Game Details'
        }
    }, db.redisView(function(client, done, req, res, wrap) {
        var GET = req.params;
        var slug = GET.slug;

        if (!slug) {
            res.json(400, {error: 'bad_game'});
            done();
            return;
        }

        gamelib.getGameIDFromSlug(client, slug, function(err, id) {
            if (err) {
                res.json(500, {error: 'db_error'});
                done();
                return;
            }

            gamelib.getPublicGameObj(client, id, function(game) {
                if (!game) {
                    res.json(500, {error: 'db_error'});
                } else {
                    res.json(game);
                }
                done();
            });
        });
    }));

    // TODO: Serve each manifest from a separate subdomain.
    server.get({
        url: '/manifest.html'
    }, function(req, res) {
        var app_url = req.url.split('?')[1];
        res.send("<script>window.location = '" + app_url + "';</script>");
    });
};
