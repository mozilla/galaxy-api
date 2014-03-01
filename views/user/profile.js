var _ = require('lodash');

var auth = require('../../lib/auth');
var db = require('../../db');
var user = require('../../lib/user');

module.exports.putUpdateProfile =
    db.redisView(function(client, done, req, res) {
        var DATA = req.params;
        var email = req._email;

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
        
    });
