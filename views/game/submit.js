var db = require('../../db');
var gamelib = require('../../lib/game');
var utils = require('../../lib/utils');


module.exports.postSubmitGame =
    db.redisView(function(client, done, req, res, wrap) {
        var POST = req.params;
        slug = utils.slugify(POST.slug || POST.name);
        var data = {
            app_url: POST.app_url,
            appcache_path: POST.appcache_path,
            artwork: {
                background: POST.artwork_background
            },
            created: new Date(),
            default_locale: POST.default_locale,
            description: POST.description,
            developer: {
                name: POST.developer_name,
                url: POST.developer_url
            },
            fullscreen: POST.fullscreen,
            genre: POST.genre,
            homepage_url: POST.homepage_url,
            icons: POST.icons,
            license: POST.license,
            locales: POST.locales,
            name: POST.name,
            orientation: POST.orientation,
            privacy_policy_url: POST.privacy_policy_url,
            screenshots: POST.screenshots,
            status: 'pending',
            slug: slug,
            videos: POST.videos
        };

        gamelib.newGame(client, data);
        res.json(data);
    });
