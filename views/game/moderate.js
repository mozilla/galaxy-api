var _ = require('lodash');

var db = require('../../db');
var gamelib = require('../../lib/game');

// verb: status
const STATUSES = {
    approve: 'approved',
    pending: 'pending',
    reject: 'rejected',
    disable: 'disabled',
    delete: 'deleted'
};

module.exports = function(server) {
    // Sample usage:
    // % curl -X POST 'http://localhost:5000/game/mario-bros/approve'
    // % curl -X POST 'http://localhost:5000/game/mario-bros/reject'

    Object.keys(STATUSES).forEach(function (statusVerb) {
        server.post({
            url: '/game/:slug/' + statusVerb,
            swagger: {
                nickname: statusVerb,
                notes: statusVerb.substr(0, 1).toUpperCase() + statusVerb.substr(1) + ' game',
                summary: 'Change the status of a game to ' + STATUSES[statusVerb]
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
                if (err) {
                    res.json(500, {error: err});
                } else if (!game) {
                    res.json(400, {error: 'bad_game'});
                } else {
                    gamelib.updateGame(client, game, {status: STATUSES[statusVerb]});
                    res.json({success: 'true'});
                }

                done();
            });

        }));
    });
   
};
