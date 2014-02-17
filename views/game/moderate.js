var db = require('../../db');
var gamelib = require('../../lib/game.js');
var url = require('url');
var _ = require('lodash');

module.exports = function(server) {
    // Sample usage:
    // % curl http://localhost:5000/game/mario-bros/approve'
    // % curl http://localhost:5000/game/mario-bros/reject'

    //verb: status
    const STATUSES = {
        approve: 'approved',
        pending: 'pending',
        reject: 'rejected',
        disable: 'disabled',
        delete: 'deleted'
    };

    Object.keys(STATUSES).forEach(function (statusVerb) {
        server.get({
            url: '/game/:slug/' + statusVerb,
            swagger: {
                nickname: statusVerb,
                notes: statusVerb.substr(0, 1).toUpperCase() + statusVerb.substr(1) + ' game',
                summary: 'Change the status of a game to ' + statusVerb
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
                if(err) {
                    res.json({error: err});
                }
                else if (!game) {
                    res.json(400, {error: 'bad_game'});
                }
                else {
                    gamelib.updateGame(client, game, {status: STATUSES[statusVerb]});
                    res.json({success: 'true'});
                }

                done();
            });

        }));
    });
   
};
