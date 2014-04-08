var _ = require('lodash');

var db = require('../../db');
var gamelib = require('../../lib/game');
var userlib = require('../../lib/user');
var utils = require('../../lib/utils');

module.exports = function(server) {
    // Sample usage:
    // % curl -X POST 'http://localhost:5000/game/submit?_user=ssa_token' -H 'Content-Type: application/json' -H 'Accept: application/json' -d '{"app_url":"http://nuttyninjas.com/","artwork":{"background":"background.jpg"},"description":"Nutty Ninjas is a real-time shooter that brings the experience of social multiplayer gaming to a whole new level; it is a console-style game that can be played anywhere and anytime, simply with your computer and mobile devices. Multiple players can join a common gameplay screen just by using their mobile devices, and control their ninja character to unleash dangerous weapons at fellow players!","developer":{"name":"Yang Shun","url":"http://yangshun.im/"},"genre":"action","homepage_url":"http://www.nuttyninjas.com","icons":"http://png-4.findicons.com/files/icons/2297/super_mario/256/paper_mario.png","name":"Nutty Ninjas","privacy_policy_url":"http://una-org.github.io/demos.html","screenshots":["http://www.digitaltrends.com/wp-content/uploads/2011/02/nintendo-new-super-mario-bros-ds-art-screenshot.jpg","http://splitkick.com/wp-content/uploads/2013/01/newsuper2img.jpg","http://www.mariowiki.com/images/f/fc/SuperMarioBrosArtwork2.jpg","http://www.digitaltrends.com/wp-content/uploads/2011/02/nintendo-new-super-mario-bros-ds-art-screenshot.jpg","http://splitkick.com/wp-content/uploads/2013/01/newsuper2img.jpg","http://www.mariowiki.com/images/f/fc/SuperMarioBrosArtwork2.jpg","http://www.digitaltrends.com/wp-content/uploads/2011/02/nintendo-new-super-mario-bros-ds-art-screenshot.jpg","http://splitkick.com/wp-content/uploads/2013/01/newsuper2img.jpg","http://www.mariowiki.com/images/f/fc/SuperMarioBrosArtwork2.jpg"],"slug":"nutty-ninjas","videos":["http://www.youtube.com/embed/4kvT0dywaF8","http://www.youtube.com/embed/1Sow2O8D9Ok"]}'
    server.post({
        url: '/game/submit',
        swagger: {
            nickname: 'submit',
            notes: 'Submit game',
            summary: 'Submission'
        },
        validation: {
            // TODO: Validate each field of the game (#122)
            app_url: { isRequired: true },
            homepage_url: { isRequired: true },
            icons: { isRequired: true },
            name: { isRequired: true },
            number_of_players: { isRequired: true },
            screenshots: { isRequired: true }
        }
    }, userlib.userDataView(function(user, client, done, req, res) {
        if (!user.permissions || (!user.permissions.admin && !user.permissions.developer)) {
            res.json(403, {error: 'bad_permission'});
            return done();
        }

        var gameData = gamelib.publicGameObj(req.params);
        gamelib.newGame(client, gameData, user.id, db.plsNoError(res, done, function(game) {
            res.json(game);
            return done();
        }));
    }));

    // Sample usage:
    // % curl -X PUT 'http://localhost:5000/game/nutty_ninjas/edit?_user=ssa_token' -H 'Content-Type: application/json' -H 'Accept: application/json' -d '{"app_url":"http://nuttyninjas.com/","artwork":{"background":"background.jpg"},"description":"Edited Description","developer":{"name":"Yang Shun","url":"http://yangshun.im/"},"genre":"action","homepage_url":"http://www.nuttyninjas.com","icons":"http://png-4.findicons.com/files/icons/2297/super_mario/256/paper_mario.png","name":"Nutty Ninjas","privacy_policy_url":"http://una-org.github.io/demos.html","screenshots":["http://www.digitaltrends.com/wp-content/uploads/2011/02/nintendo-new-super-mario-bros-ds-art-screenshot.jpg","http://splitkick.com/wp-content/uploads/2013/01/newsuper2img.jpg","http://www.mariowiki.com/images/f/fc/SuperMarioBrosArtwork2.jpg","http://www.digitaltrends.com/wp-content/uploads/2011/02/nintendo-new-super-mario-bros-ds-art-screenshot.jpg","http://splitkick.com/wp-content/uploads/2013/01/newsuper2img.jpg","http://www.mariowiki.com/images/f/fc/SuperMarioBrosArtwork2.jpg","http://www.digitaltrends.com/wp-content/uploads/2011/02/nintendo-new-super-mario-bros-ds-art-screenshot.jpg","http://splitkick.com/wp-content/uploads/2013/01/newsuper2img.jpg","http://www.mariowiki.com/images/f/fc/SuperMarioBrosArtwork2.jpg"],"slug":"nutty-ninjas","videos":["http://www.youtube.com/embed/4kvT0dywaF8","http://www.youtube.com/embed/1Sow2O8D9Ok"]}'
    server.put({
        url: '/game/:slug/edit',
        swagger: {
            nickname: 'edit',
            notes: 'Edit game',
            summary: 'Edit game details'
        },
        validation: {
            // TODO: Validate each field of the game (#122)
            app_url: { isRequired: true },
            homepage_url: { isRequired: true },
            icons: { isRequired: true },
            name: { isRequired: true },
            number_of_players: { isRequired: true },
            screenshots: { isRequired: true },
            slug: { isRequired: true }
        }
    }, userlib.userDataView(function(user, client, done, req, res) {
        if (!user.permissions || (!user.permissions.admin && !user.permissions.developer)) {
            res.json(403, {error: 'bad_permission'});
            return done();
        }

        var gameData = gamelib.publicGameObj(req.params);
        var slug = gameData.slug;

        gamelib.getGameFromSlug(client, slug, db.plsNoError(res, done, function(game) {
            // The actual game data contains some fields that are not public editable,
            // so we need to merge the game with these protected fields.
            var protectedFields = gamelib.protectedFields(game);
            gameData = _.extend(gameData, protectedFields);

            gamelib.updateGame(client, slug, gameData, db.plsNoError(res, done, function(game) {
                res.json(game);
                return done();
            }));
        }));
    }));
};
