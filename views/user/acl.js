var db = require('../../db');
var userlib = require('../../lib/user');


module.exports = function(server) {
    // Sample usage:
    // % curl -X POST 'http://localhost:5000/user/acl' -d 'id=1&dev=1&reviewer=1&admin=0'
    server.post({
        url: '/user/acl',
        validation: {
            _user: {
                description: "An admin user's SSA token",
                isRequired: true
            },
            id: {
                description: 'User ID to change permissions for',
                isRequired: true
            },
            dev: {
                description: 'Whether or not user should have developer permissions',
                isRequired: false
            },
            reviewer: {
                description: 'Whether or not user should have reviewer permissions',
                isRequired: false
            },
            admin: {
                description: 'Whether or not user should have admin permissions',
                isRequired: false
            }
        },
        swagger: {
            nickname: 'acl',
            notes: 'Update User Permissions',
            summary: 'ACL'
        }
    }, user.userDataView(function(authenticator, client, done, req, res) {
        // make sure user is admin
        if (!authenticator.permissions.admin) {
            res.json(403, {error: 'bad_permission'});
            done();
            return;
        }

        var POST = req.params;
        var userID = POST.id;
        // Convert from string to bool
        var isDev = !!+POST.dev;
        var isRev = !!+POST.reviewer;
        var isAdmin = !!+POST.admin;

        // Get user who is sending request.
        userlib.getUserFromEmail(client, email, function(err, user) {
            if (err) {
                console.error(err);
                res.json(500, {error: 'db_error'});
                return done();
            } else if (!user) {
                console.error('Failed looking up user');
                res.json(500, {error: 'bad_user'});
                return done();
            }

            // Update permissions of target user.
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
                    res.json({permissions: newData.permissions});
                }
                done();

                // Make sure user is admin.
                if (!user.permissions.admin) {
                    res.json(403, {error: 'bad_permission'});
                    return done();
                }

                var POST = req.params;
                var userID = POST.id;

                console.log('Attempting permission update');

                // Update permissions of target user.
                userlib.getUserFromID(client, userID, function(err, resp) {
                   if (err || !resp) {
                        res.json(500, {error: err || 'db_error'});
                        return done();
                    }

                    userlib.updateUser(client, user, {
                        permissions: {
                            developer: !!+POST.dev,
                            reviewer: !!+POST.reviewer,
                            admin: !!+POST.admin
                        }
                    }, function(err, newData) {
                        if (err) {
                            console.error(err);
                            res.json(500, {error: err});
                        } else {
                            res.json({permissions: newData.permissions});
                        }
                        done();
                    });
                });
            });
        });
    }));
};
