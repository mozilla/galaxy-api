var db = require('../../db');
var userlib = require('../../lib/user');


module.exports = function(server) {
    // Sample usage:
    // % curl -X POST 'http://localhost:5000/user/acl' -d 'id=1&developer=1&reviewer=1&admin=0'
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
            developer: {
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
    }, userlib.userDataView(function(authenticator, client, done, req, res) {
        // Make sure user is admin
        if (!authenticator.permissions.admin) {
            res.json(403, {error: 'bad_permission'});
            done();
            return;
        }

        var POST = req.params;
        var userID = POST.id;

        // Update permissions of target user.
        userlib.getUserFromID(client, userID, function(err, resp) {
           if (err || !resp) {
                res.json(500, {error: err || 'db_error'});
                return done();
            }

            userlib.updateUser(client, userID, {
                permissions: {
                    developer: !!+POST.developer,
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
    }));
};
