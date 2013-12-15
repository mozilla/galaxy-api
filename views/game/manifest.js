var db = require('../.././db');


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
    }, function(req, res) {
        var GET = req.params;
        var slug = GET.slug;

        var game = db.flatfile.read('game', slug);

        var keys = [
            'appcache_path',
            'default_locale',
            'description',
            'icons',
            'locales',
            'name',
            'orientation'
        ];

        var data = {};

        keys.forEach(function(v) {
            var value = game[v];
            if (!_.isEmpty(value)) {
                data[v] = value;
            }
        });

        res.contentType = 'application/x-web-app-manifest+json';
        res.send(JSON.stringify(data));
    });

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
