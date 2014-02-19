var _ = require('lodash');

var auth = require('../../lib/auth');
var db = require('../../db');
var gamelib = require('../../lib/game');
var user = require('../../lib/user');

const DEFAULT_COUNT = 15;

module.exports = function(server) {
    // Sample usage:
    // % curl 'http://localhost:5000/game/list'
    server.get({
        url: '/game/list',
        swagger: {
            nickname: 'list',
            notes: 'List of games matching provided filter',
            summary: 'Game List'
        },
        validation: {
            _user: {
                description: 'User (ID or username slug)',
                isRequired: false  // Only required for restricted filters
            },
            count: {
                description: 'Maximum number of games to return',
                isRequired: false,
                isInt: true,
                min: 1,
                max: 100
            },
            status: {
                description: 'Filter by current status of the game',
                isRequired: false,
                isIn: ['approved', 'pending', 'rejected']
            }
        }
    }, db.redisView(function(client, done, req, res, wrap) {
        var GET = req.params;
        var count = 'count' in GET ? parseInt(GET.count, 10) : DEFAULT_COUNT;
        var statusFilter = GET.status;

        if (!statusFilter) {
            fetchGames();
            return;
        }

        var email = req._email;
        if (!email) {
            notAuthorized();
            return;
        }

        user.getUserFromEmail(client, email, function(err, userData) {
            if (err) {
                res.json(500, {error: err || 'db_error'});
                done();
                return;
            }

            var permissions = userData.permissions;
            for (var p in Object.keys(permissions)) {
                // 'status' should only be accessible to reviewers and admins
                if (permissions[p] && (p === 'reviewer' || p === 'admin')) {
                    return fetchGames();
                }
            }
            return notAuthorized();
        });

        function notAuthorized() {
            res.json(401, {
                error: 'not_permitted', 
                detail: 'provided filters require additional permissions'
            });
            done();
        };

        function fetchGames() {
            // TODO: Filter only 'count' games without having to fetch them all first
            // (will be somewhat tricky since we need to ensure order to do pagination
            // properly, and we use UUIDs for game keys that have no logical order in the db)
            gamelib.getPublicGameObjList(client, null, function(games) {
                var filteredGames = games;
                if (statusFilter) {
                    // Filter for games matching the provided status
                    filteredGames = games.filter(function(game) {
                        return game.status === statusFilter;
                    });
                }
                // Pick the first 'count' games
                var gamesUpToCount = _.first(filteredGames, count);
                res.json(gamesUpToCount);
                done();
            });
        }
    }));
};
