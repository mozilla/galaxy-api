var _ = require('lodash');

var db = require('../../db');
var gamelib = require('../../lib/game');


module.exports = function(server) {
    // Sample usage:
    // % curl 'http://localhost:5000/game/mario-bros/manifest'
    server.get({
        url: '/game/:slug/manifest/firefox',
        swagger: {
            nickname: 'manifest',
            notes: 'Firefox Webapp Manifest JSON synthesised on the fly from app data',
            summary: 'Webapp manifest'
        }
    }, db.redisView(function(client, done, req, res, wrap) {
        var GET = req.params;
        var slug = GET.slug;

        if (!slug) {
            res.json(400, {error: 'bad_game'});
            done();
            return;
        }

        gamelib.getGameFromSlug(client, slug, function(err, game) {
            if (!game) {
                res.json(400, {error: 'bad_game'});
                done();
                return;
            }

            if (err) {
                res.json(500, {error: 'db_error'});
                done();
                return;
            }

            var keys = [
                'appcache_path',
                'default_locale',
                'description',
                'icons',
                'locales',
                'name',
                'orientation'
            ];

            var data = _.pick(game, keys);

            res.contentType = 'application/x-web-app-manifest+json';
            res.send(JSON.stringify(data));
            done();
        });
    }));

    // Sample usage:
    // % curl 'http://localhost:5000/launch.html?https://mariobro.se'

    // TODO: Serve each manifest from a separate subdomain.
    server.get({
        url: '/launch.html',
        swagger: {
            nickname: 'launch',
            notes: 'Launch webapp from a URL based on querystring',
            summary: 'Webapp Launcher'
        }
    }, function(req, res) {
        var app_url = req.url.split('?')[1];
        res.send("<script>window.location = '" + app_url + "';</script>");
    });
};
