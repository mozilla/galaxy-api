var _ = require('lodash');

var db = require('../../db');
var gamelib = require('../../lib/game');


module.exports = function(statusState) {
    return db.redisView(function(client, done, req, res, wrap) {

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
                gamelib.updateGame(client, game, {status: statusState});
                res.json({success: 'true'});
            }

            done();
        });

    });
}
