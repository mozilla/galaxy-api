var auth = require('../../lib/auth');
var db = require('../../db');
var user = require('../../lib/user');


module.exports = function(server) {
    // Sample usage:
    // % curl 'http://localhost:5000/user/search?_user=ssatoken'
    server.get({
        url: '/user/search',
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
        console.log(DATA);

        var lookup_email = DATA.email;
        var lookup_id = DATA.id;
        var lookup = lookup_email || lookup_id;

        if (!lookup) {
            res.json(400, {error: 'Must provide either email or user ID'});
            done();
            return;
        }

        var _user = DATA._user;
        var email;
        if (!(email = auth.verifySSA(_user))) {
            res.json(403, {error: 'bad_user'});
            done();
            return;
        }

        if (lookup_email) {
            user.getUserFromEmail(client, lookup_email, function(err, obj) {
                console.log('obj',obj)
                if (err || !obj) {
                    res.json(400, {error: err || 'bad_email'});
                    done();
                    return;
                }
                res.json(user.publicUserObj(obj));
                done();
            });
        } else if (lookup_id) {
            user.getUserFromID(client, lookup_email, function(err, obj) {
                if (err || !obj) {
                    res.json(400, {error: err || 'bad_id'});
                    done();
                    return;
                }
                res.json(user.publicUserObj(obj));
                done();
            });
        }
    }));
};
