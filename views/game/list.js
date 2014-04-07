var _ = require('lodash');
var Promise = require('es6-promise').Promise;

var auth = require('../../lib/auth');
var db = require('../../db');
var gamelib = require('../../lib/game');
var user = require('../../lib/user');

const DEFAULT_COUNT = 15;

module.exports = function(server) {
    // Sample usage:
    // % curl 'http://localhost:5000/game/list?_user=ssa_token&developer=1&status=pending'
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
                isIn: ['approved', 'pending', 'rejected', 'disabled', 'deleted']
            },
            developer: {
                description: 'Filter by requesting developer',
                isRequired: false
            }
        }
    }, db.redisView(function(client, done, req, res, wrap) {
        var GET = req.params;
        var count = 'count' in GET ? parseInt(GET.count, 10) : DEFAULT_COUNT;
        var statusFilter = GET.status;
        var developerFilter = !!+GET.developer;

        if (!(statusFilter || developerFilter)) {
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
            for (var p in permissions) {
                // 'status' filter should only be accessible to reviewers and admins
                // 'developer' filter should only be accessible to developers
                if ((statusFilter && permissions[p] && (p === 'reviewer' || p === 'admin')) ||
                    (developerFilter && permissions[p] && (p === 'developer'))) {
                    return fetchGames(userData);
                }
            }
            return notAuthorized();
        });

        function notAuthorized() {
            res.json(403, {
                error: 'bad_permission', 
                detail: 'provided filters require additional permissions'
            });
            done();
        };

        function fetchGames(userData) {
            // TODO: Filter only 'count' games without having to fetch them all first
            // (will be somewhat tricky since we need to ensure order to do pagination
            // properly, and we use UUIDs for game keys that have no logical order in the db)
            if (developerFilter) {
                client.hget('gameIDsByDeveloperID', userData.id, function(err, ids) {
                    if (err) {
                        res.json(500, {error: err || 'db_error'});
                        done();
                        return;
                    }
                    if (!ids) {
                        gameListHandler(null, []);
                    } else {
                        gamelib.getGameList(client, JSON.parse(ids), gameListHandler);
                    }
                });
            } else {
                gamelib.getGameList(client, null, gameListHandler);
            }

            function gameListHandler(err, games) {
                if (err || !games) {
                    res.json(500, {error: err || 'db_error'});
                    return done();
                }
                var filteredGames = games;
                if (statusFilter) {
                    // Filter for games matching the provided status
                    filteredGames = games.filter(function(game) {
                        return game.status === statusFilter;
                    });
                }
                // Pick the first 'count' games
                var gamesUpToCount = _.first(filteredGames, count);

                if (developerFilter) {
                    // Add queue position if using the developer filter
                    function queuePromise(game) {
                        return new Promise(function(resolve, reject) {
                            if (game.status === 'pending') {
                                client.zrank('gamesByStatus:pending', game.id,
                                    function(err, rank) {
                                        if (err) {
                                            reject(err);
                                        } else {
                                            game.queuePosition = rank + 1;
                                            resolve(game);
                                        }
                                });
                            } else {
                                resolve(game);
                            }                            
                        });
                    }

                    Promise.all(gamesUpToCount.map(queuePromise)).then(function(games) {
                        var publicGames = games.map(gamelib.publicGameObj);
                        res.json(publicGames);
                        done();
                    }, function(err) {
                        res.json(500, {error: err || 'db_error'});
                        done();
                    });
                } else {
                    var publicGames = gamesUpToCount.map(gamelib.publicGameObj);
                    res.json(publicGames);
                    done();
                }
            }
        }
    }));
};
