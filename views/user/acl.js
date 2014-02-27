var auth = require('../../lib/auth');
var db = require('../../db');
var user = require('../../lib/user');


module.exports.postAcl =
    db.redisView(function(client, done, req, res) {
        var POST = req.params;

        var userID = POST.id;
        // Convert from string to bool
        var isDev = !!+POST.dev;
        var isRev = !!+POST.reviewer;
        var isAdmin = !!+POST.admin;
        var email = req._email;

        // Get user who is sending request and make sure it is an admin
        user.getUserFromEmail(client, email, function(err, authenticator) {
            if (err || !authenticator) {
                res.json(500, {error: 'db_error'});
                done();
                return;
            }

            // make sure user is admin
            if (!authenticator.permissions.admin) {
                res.json(403, {error: 'bad_permission'});
                done();
                return;
            } 

            // update permissions of target user
            user.getUserFromID(client, userID, function(err, resp) {
                if (err || !resp) {
                    res.json(500, {error: 'db_error'});
                    done();
                    return;
                }

                user.updateUser(client, resp, {
                    permissions: {
                        developer: isDev,
                        reviewer: isRev,
                        admin: isAdmin
                    }
                }, function(err, newData) {
                    if (err) {
                        res.json(500, {error: 'db_error'});
                    } else {
                        res.json(200, {permissions: newData.permissions});
                    }
                    done();
                });

            });
        });
    });
