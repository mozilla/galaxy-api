var _ = require('lodash');

var db = require('../../db');


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
    }, function(req, res) {
        var GET = req.params;
        var slug = GET.slug;

        var game = db.flatfile.read('game', slug);

        var keys = [
            'app_url',
            'appcache_path',
            'created',
            'default_locale',
            'description',
            'developer_name',
            'developer_url',
            'fullscreen',
            'genre',
            'homepage_url',
            'icons',
            'license',
            'locales',
            'name',
            'orientation',
            'privacy',
            'screenshots',
            'slug'
        ];

        var data = _.pick(game, keys);

        res.json(data);
    });
};
