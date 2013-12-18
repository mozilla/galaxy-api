var auth = require('../../lib/auth');
var db = require('../../db');
var user = require('../../lib/user');


module.exports = function(server) {
    // Sample usage:
    // % curl -X POST 'http://localhost:5000/user/login' -d 'assertion=&audience'
    server.post({
        url: '/user/login',
        swagger: {
            nickname: 'login',
            notes: 'Sign in via Persona',
            summary: 'Login'
        }
    }, function(req, res) {
        var POST = req.params;

        var assertion = POST.assertion;
        var audience = POST.audience || '';

        console.log('Attempting verification:', audience);
        
        auth.verifyPersonaAssertion(
            assertion,
            audience,
            function(err, body) {
                console.log(err, body);
                if (err) {
                    res.json(403, {error: 'bad_assertion'});
                    return;
                }

                console.log('Assertion verified.');
                // Establish the redis connection here so we don't flood the
                // server with connections that never get used.
                var client = db.redis();
                var email = body.email;
                user.getUserFromEmail(client, email, function(err, resp) {
                    if (err) {
                        res.json(500, {error: err});
                        return;
                    } else if (!resp) {
                        resp = user.newUser(client, email);
                    }
                    res.json({
                        error: null,
                        token: auth.createSSA(email),
                        settings: {
                            username: resp.username,
                            email: email,
                            id: resp.id
                        },
                        permissions: {}
                    });
                    client.end();
                });
            }
        );
    });
};
