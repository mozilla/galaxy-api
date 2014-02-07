var db = require('../../db');
var utils = require('../../lib/utils');


module.exports = function(server) {
    // Sample usage:
    // % curl http://localhost:5000/game/mario-bros/approve'

    server.get({
        url: '/game/:slug/:type(approve|pending|reject|disabled|delete)/',
        swagger: {
            nickname: 'approve',
            notes: 'Approve game',
            summary: 'Approve a game for submission'
        },
        validation: { }
    }, function(req, res) {
        var GET = req.params;
        var slug = GET.slug

        var status = req.url.replace(/^\/game\/[a-zA-Z0-9\s-]+\//, "");

        res.json({slug: GET.slug, status: status})
    });
};
