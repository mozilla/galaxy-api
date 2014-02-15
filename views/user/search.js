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
            },
            devSlug: {
                description: 'Company Slug to search for',
                isRequired: false
            },
            q: {
                description: 'Email/user ID/username to search for',
                isRequired: false
            }
        }
    }, db.redisView(function(client, done, req, res) {
        var DATA = req.params;
        console.log(DATA);

        var lookup_email = DATA.email;
        var lookup_id = DATA.id;
        var lookup_q = DATA.q;
        var lookup_dev = DATA.devSlug;
        var lookup = lookup_email || lookup_id || lookup_q || lookup_dev;

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

        // TODO: Allow searching by username.
        // (i.e., if no results for email, look by username, etc.)
        if (lookup_q) {
            user.getUserIDFromEmail(client, lookup, function(err, obj) {
                if (err || !obj) {
                    res.json(400, {error: err || lookup_email ? 'bad_email' : 'bad_id'});
                    done();
                    return;
                }
                // TODO: Exclude yourself from the object list.
                user.getPublicUserObjList(client, [obj], function(objs) {
                    done();
                    res.json(objs);
                });
            });
        } else if (lookup_dev) {
            user.getCompanyInfoFromDevSlug(client, lookup, function(err, obj) {
                if (err || !obj) {
                    res.json(400, {error: err || 'bad_dev_slug'});
                    done();
                    return;
                }
                res.json(obj);
                done();
            });
        } else {
            // Return a single object.
            (lookup_email ? user.getUserFromEmail : user.getUserFromID)(client, lookup, function(err, obj) {
                if (err || !obj) {
                    res.json(400, {error: err || lookup_email ? 'bad_email' : 'bad_id'});
                    done();
                    return;
                }
                // TODO: Look up `id` from `getUserIDFromEmail` and compare.
                // We don't necessarily want to exclude user from looking up
                // himself/herself (think of the case of accessing user
                // profile page).

                // if (obj.email === email) {
                //     res.json(400, {error: err || 'thats_you_silly'});
                //     done();
                //     return;
                // }
                res.json(user.publicUserObj(obj));
                done();
            });
        }
    }));
};
