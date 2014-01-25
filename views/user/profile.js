var _ = require('lodash');

var auth = require('../../lib/auth');
var db = require('../../db');
var user = require('../../lib/user');

module.exports = function(server) {
    // Sample usage:
    // % curl -X PUT 'http://localhost:5000/user/profile?_user=ssatoken'
    /*
    Optional params (at least one must be provided to have any effect):
    ?username=new_name
    &email=new_address
    */
    server.put({
        url: '/user/profile',
        swagger: {
            nickname: 'update-profile',
            notes: 'Update user profile',
            summary: 'Update user profile'
        },
        validation: {
            _user: {
                description: 'User (ID or username slug)',
                isRequired: true
            },
            email: {
                description: 'New user email',
                isEmail: true,
                isRequired: false,
            },
            username: {
                description: 'New username',
                isRequired: false,
            }
        }
    }, db.redisView(function(client, done, req, res) {
        var PUT = req.params;

        var _user = PUT._user;
        var email;
        if (!(email = auth.verifySSA(_user))) {
            res.json(403, {error: 'bad_user'});
            done();
            return;
        }

        var recipient = PUT.recipient;

        user.getUserFromEmail(client, email, function(err, userData) {
            if (err || !userData) {
                res.json(500, {error: err || 'db_error'});
                done();
                return;
            }
            updateUserData(userData);
        });
        function updateUserData(data) {
            var hasChanges = false;
            var newEmail = PUT.email;
            var newUsername = PUT.username;

            updateEmail(data);

            function updateEmail(userData) {
                // Email validation is handled by node-restify-validation, so we can assume
                // that if it exists, it is a well-formatted address.
                // TODO: We should probably send an email when the address changes
                if (newEmail && newEmail !== email) {
                    client.hexists('usersByEmail', newEmail, function(err, resp) {
                        if (err || resp) {
                            res.json(400, 'email_in_use');
                            done();
                            return;
                        }
                        console.log('updating email from', email, 'to', newEmail, 'for user', userData.id);
                        userData.email = newEmail;
                        client.hdel('usersByEmail', email);
                        client.hset('usersByEmail', newEmail, userData.id);
                        hasChanges = true;

                        updateUsername(userData);
                    });
                } else {
                    updateUsername(userData);
                }
            }
            function updateUsername(userData) {
                // TODO: Some username validation would be nice to have (ie. profanity check)
                if (newUsername && newUsername !== userData.username) {
                    console.log('updating username from', userData.username, 'to', newUsername, 'for user', userData.id);
                    userData.username = newUsername;
                    hasChanges = true;
                }
                updateClient(userData);
            }
            function updateClient(userData) {
                function success() {
                    res.json(202, {success: true});
                    done();
                }
                if (hasChanges) {
                    client.hset('users', userData.id, JSON.stringify(userData), function(err, reply) {
                        if (err) {
                            res.json(400, {error: true});
                            done();
                        } else {
                            success();
                        }
                    });
                } else {
                    success();
                }
            }
        }
    }));
};