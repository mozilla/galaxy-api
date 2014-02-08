var auth = require('../../lib/auth');
var db = require('../../db');
var user = require('../../lib/user');
var utils = require('../../lib/utils');


module.exports = function(server) {
    // Sample usage:
    // % curl -X POST 'http://localhost:5000/user/acl' -d 'id=1&dev=true&rev=true'
    // TODO: Make sure only admins can do this
    server.post({
        url: '/user/acl',
        validation: {
            id: {
                description: 'User ID to change permissions for',
                isRequired: true
            },
            dev: {
                description: 'Whether or not user should have developer permissions',
                isRequired: false
            },
            rev: {
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
    }, db.redisView(function(client, done, req, res) {
        var POST = req.params;

        var userID = POST.id;
        var isDev = POST.dev || null;
        var isRev = POST.rev || null;
        var isAdmin = POST.admin || null;

        console.log('Attempting permission update:');

        // make sure isDev and isRev are bools, not strings
        switch (isDev) {
            case "true":
                isDev = true;
                break;
            case "false":
                isDev = false;
                break;
            case null:
            case true:
            case false:
                break;
            default:
                res.json(500, {error: "Dev must be 'true' or 'false'"});
                done();
                return;
        }

        switch (isRev) {
            case "true":
                isRev = true;
                break;
            case "false":
                isRev = false;
                break;
            case null:
            case true:
            case false:
                break;
            default:
                res.json(500, {error: "Rev must be 'true' or 'false'"});
                done();
                return;
        }

        switch (isAdmin) {
            case "true":
                isAdmin = true;
                break;
            case "false":
                isAdmin = false;
                break;
            case null:
            case true:
            case false:
                break;
            default:
                res.json(500, {error: "Admin must be 'true' or 'false'"});
                done();
                return;
        }

        user.getUserFromID(client, userID, function(err, resp) {
            if (err || !resp) {
                res.json(500, {error: err || 'db_error'});
                done();
                return;
            }


            var newData = user.updateUser(client, resp, {
                permissions: {
                  developer: isDev != null ? isDev : resp.permissions.developer,
                  reviewer: isRev != null ? isRev : resp.permissions.reviewer,
                  admin: isAdmin != null ? isAdmin : resp.permissions.admin
                }
            });

            console.log('permissions granted.');

            res.json(200, {
                permissions: newData.permissions
            });

            done();
            return;

        });
        
      })
    );
};
