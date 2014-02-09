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
        var DATA = req.params;

        var _user = DATA._user;
        var email;
        if (!(email = auth.verifySSA(_user))) {
            res.json(403, {error: 'bad_user'});
            done();
            return;
        }

        user.getUserIDFromEmail(client, email, function(err, userID) {
            if (err || !userID) {
                res.json(500, {error: err || 'db_error'});
                done();
                return;
            }

            var dataToUpdate = _.pick(DATA, 'username', 'email');
            user.updateUser(client, userID, dataToUpdate, function(err, newUserData) {
                if (err) {
                    res.json(500, {error: err});
                } else {
                    res.json(202, {success: true});
                }
                done();
            });
        });
        
    }));
};
