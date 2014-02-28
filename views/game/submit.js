var _ = require('lodash');
var db = require('../../db');
var gamelib = require('../../lib/game');
var utils = require('../../lib/utils');


module.exports = function(server) {
    // Sample usage:
    // % curl -X POST 'http://localhost:5000/game/submit' -d 'name=Mario Bros&app_url=http://mariobro.se&icons=128&screenshots=yes'
    server.post({
        url: '/game/submit',
        swagger: {
            nickname: 'submit',
            notes: 'Submit game',
            summary: 'Submission'
        },
        validation: {
            app_url: {
                description: 'App URL',
                isRequired: true,
                isUrl: true
            },
            homepage_url: {
                description: 'Homepage URL',
                isRequired: false,
                isUrl: true
            },
            icons: {
                description: 'Icons',
                isRequired: false,
            },
            name: {
                description: 'Name',
                isRequired: true,
                max: 128
            },
            screenshots: {
                description: 'Screenshots',
                isRequired: false
            }
        }
    }, db.redisView(function(client, done, req, res, wrap) {
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
            slug: slug,
            videos: POST.videos
        };

        gamelib.newGame(client, data);
        res.json(data);
    }));

    // Sample usage:
    // % curl -X PATCH 'http://localhost:5000/game/mario-bros/edit'
    server.put({
        url: '/game/edit',
        swagger: {
            nickname: 'edit',
            notes: 'Edit game',
            summary: 'Edit game details'
        },
        validation: {
            app_url: {
                description: 'App URL',
                isRequired: true,
                isUrl: true
            },
            slug: {
                description: 'Genre slug',
                isRequired: true
            },
            homepage_url: {
                description: 'Homepage URL',
                isRequired: false,
                isUrl: true
            },
            name: {
                description: 'Name',
                isRequired: true,
            }
        }
    }, db.redisView(function(client, done, req, res, wrap) {
        var PUT = req.params;
        var slug = PUT.slug;

        // TODO: Check if user has the correct ACL permissions to update
        // TODO: Check if slug is valid

        if (!slug) {
            res.json(400, {error: 'bad_game'});
            done();
            return;
        }
        // TODO: Add icon, screenshots and videos to dataToUpdate
        var dataToUpdate = _.pick(PUT, 'name', 'slug', 'app_url', 'description', 'privacy_policy_url', 'genre');

        // TODO: instead of PUT use {id: gameID} and look 
        // that up in redis. or restructure updateGame to accept 
        // a slug when doing the lookups to update.
        gamelib.updateGame(client, PUT, dataToUpdate);
        res.json(dataToUpdate);
    }));
};
