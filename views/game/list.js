var _ = require('lodash');

var db = require('../../db');
var gamelib = require('../../lib/game');
var user = require('../../lib/user');

module.exports = function(server) {
    function matchesAny(list) {
        return (function(x) {
            return _.contains(list, x);
        });
    };

    const accepted_filters = {
        status: {
            description: 'Filter by current status of the game',
            isRequired: false,
            isIn: ['approved', 'pending', 'rejected'],
            requiredPermissions: matchesAny(['reviewer', 'admin'])
        }
    };
    const restricted_filters = _.pick(accepted_filters, (function() {
        return Object.keys(accepted_filters).filter(function(f) {
            return !!accepted_filters[f].requiredPermissions;
        });
    })());
    var DEFAULT_COUNT = 15;

    // Sample usage:
    // % curl 'http://localhost:5000/game/list'
    server.get({
        url: '/game/list',
        swagger: {
            nickname: 'list',
            notes: 'List of games matching provided filter',
            summary: 'Game List'
        },
        validation: _.extend({
            _user: {
                description: 'User (ID or username slug)',
                isRequired: false // Only required for restricted filters
            },
            count: {
                description: 'Maximum number of games to return',
                isRequired: false,
                isInt: true,
                min: 1,
                max: 100
            }
        }, accepted_filters)
    }, db.redisView(function(client, done, req, res, wrap) {
        var GET = req.params;
        var filters = _.pick(GET, Object.keys(accepted_filters));
        var count = (GET.count && parseInt(GET.count)) || DEFAULT_COUNT;

        ensureAuthorized(function() {
            // TODO: Filter only 'count' games without having to fetch them all first
            // (will be somewhat tricky since we need to ensure order to do pagination
            // properly, and we use UUIDs for game keys that have no logical order in the db)
            gamelib.getPublicGameObjList(client, null, filters, function(games) {
                res.json(_.first(games, count));
                done();
            });
        });

        function ensureAuthorized(callback) {
            var filtersToAuthorize = _.pick(restricted_filters, Object.keys(filters));
            var authKeys = Object.keys(filtersToAuthorize);
            if (!authKeys.length) {
                return callback();
            }

            var _user = GET._user;
            if (!_user) {
                return notAuthorized();
            }

            var email;
            if (!(email = auth.verifySSA(_user))) {
                res.json(403, {error: 'bad_user'});
                done();
                return;
            }

            user.getUserFromEmail(client, email, function(err, userData) {
                if (err) {
                    res.json(500, {error: err || 'db_error'});
                    done();
                    return;
                }

                var permissions = Object.keys(_.map(userData.permissions, function(hasPerm, p) {
                    return !!hasPerm;
                }));
                var hasPermissions = _.every(authKeys, function(key) {
                    return filtersToAuthorize[key](permissions);
                });
                if (!hasPermissions) {
                    notAuthorized();
                } else {
                    callback();
                }
            });

            function notAuthorized() {
                res.json(401, {
                    error: 'not_permitted', 
                    detail: 'provided filters require additional permissions'
                });
                done();
            };
        }
    }));
};
