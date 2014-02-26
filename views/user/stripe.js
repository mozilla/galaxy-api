var request = require('request');

var auth = require('../../lib/auth');
var db = require('../../db');
var user = require('../../lib/user');

// Stripe ID for Stripe Application
var STRIPE_CLIENT_ID = process.env.STRIPE_CLIENT_ID;
//client id = ca_3YHIK19IDhPkGAqYNClK9QzzquyCknAo

module.exports = function(server) {
    // Sample usage:
    // % curl -X POST 'http://localhost:5000/user/acl' -d 'id=1&dev=1&reviewer=1&admin=1'
    server.post({
        url: '/user/stripe/token',
        validation: {
            _user: {
                description: "A user's SSA token",
                isRequired: true
            },
            code: {
                description: 'Developer Stripe Code used for token request',
                isRequired: true
            }
        },
        swagger: {
            nickname: 'stripe',
            notes: 'Get Stripe Access Token and Save',
            summary: 'Get Stripe Access Token and Save'
        }
    }, db.redisView(function(client, done, req, res) {
        var POST = req.params;
        var code = POST.code;
        var _user = POST._user;
        var email = auth.verifySSA(_user);

        if (!email) {
            res.json(403, {error: 'bad_user'});
            done();
            return;
        }

        // Get user who is sending request and make sure it is a developer
        user.getUserFromEmail(client, email, function(err, dev) {
            if (err || !dev) {
                res.json(500, {error: 'db_error'});
                done();
                return;
            }

            // make sure user is developr
            if (!dev.permissions.developer) {
                res.json(403, {error: 'bad_permission'});
                done();
                return;
            } 

            // make a POST to Stripe to get access token

            var req = request.post({
                url: 'https://connect.stripe.com/oauth/token',
                form: {
                    client_secret: STRIPE_CLIENT_ID,
                    grant_type: 'authorization_code',
                    code: code
                }
            }, function(err, resp, body) {
                if (err) {
                    res.json(500, {error: 'connection_error'});
                    return;
                }
                var json_resp = JSON.parse(body);
                if (json_resp.error) {
                    res.json(500, {error: 'connection_error'});
                    return;
                } else {
                    //update access token for user in database
                    dev.updateUser(client, resp, {
                        stripeToken: json_resp.access_token
                    }, function(err, newData) {
                        if (err) {
                            res.json(500, {error: 'db_error'});
                        } else {
                            res.json(200, {success: 'success'})
                        }
                    });
                }
            });
        });
    }));
};
