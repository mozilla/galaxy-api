var redis = require('../../db').redis;

module.exports = function(server) {
    // Sample usage:
    // % curl http://localhost:5000/game/mario-bros/approve'


    statuses = ['approve', 'pending', 'reject', 'disabled', 'delete'];

    statuses.forEach(function (status) {
        server.get({
                url: '/game/:slug/' + status,
                swagger: {
                    nickname: status,
                    notes: status + ' game',
                    summary: 'Change the status of a game to ' + status
                }
            }, function(req, res) {

                var GET = req.params;
                var slug = GET.slug;

                //TODO: save new status to redis

                res.json({slug: slug, status: status});
            }
        );
    });
   
};
