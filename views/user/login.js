var auth = require('../../lib/auth');


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
                if (err) {
                    res.json(403, {error: 'bad_assertion'});
                    return;
                }

                console.log('Assertion verified.');
                res.json({
                    error: null,
                    token: auth.createSSA(body.email),
                    settings: {
                        // TODO: return `username` from server.
                        display_name: email.split('@')[0],
                        email: body.email
                    },
                    permissions: {}
                });
            }
        );
    });
};
