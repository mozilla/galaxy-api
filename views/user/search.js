var auth = require('../../lib/auth');
var db = require('../../db');
var user = require('../../lib/user');


module.exports = function(server) {
    // Sample usage:
    // % curl 'http://localhost:5000/user/friends?_user=ssatoken'
    server.get({
        url: '/user/friends',
        validation: {
            _user: {
                description: "A user's SSA token",
                isRequired: true
            },
            email: {
                description: 'Email to search for',
                isRequired: false
            },
            id: {
                description: 'User ID to search for',
                isRequired: false
            }
        }
    }, db.redisView(function(client, done, req, res) {
        var DATA = req.params;

        var lookup_email = DATA.email;
        var lookup_id = DATA.id;
        var lookup = lookup_email || lookup_id;

        if (lookup) {
            res.json(400, {error: 'Must provide email or user ID'});
        }

        var _user = DATA._user;
        var email;
        if (!(email = auth.verifySSA(_user))) {
            res.json(403, {error: 'bad_user'});
            done();
            return;
        }

        user.getUserIDFromEmail(client, email, function(err, id) {
            if (err || !id) {
                res.json(500, {error: err || 'db_error'});
                done();
                return;
            }

            if (lookup_email) {
                user.getUserFromEmail(client, lookup_email, function(err, id) {
                    user.getPublicUserObjList(client, id, function(objs) {
                        done();
                        res.json(objs);
                    });
                });
            } else if (lookup_id) {
                user.getUserFromID(client, lookup_email, function(err, id) {
                    user.getPublicUserObjList(client, id, function(objs) {
                        done();
                        res.json(objs);
                    });
                });
            }
        });
    }));
};
