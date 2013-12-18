var _ = require('lodash');


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
        var audience = POST.audience;

        console.log('Attempting verification:', audience);

        // var email = persona.verify_assertion(assertion, audience, is_native);
        if (!email) {
            res.json(403, {error: 'bad_assertion'});
        }

        // At this point, we know that the user is a valid user.

        return res.json({
            error: None,
            token: '',  //persona.get_token(email),
            settings: {
                // TODO: return `username` from server.
                display_name: email.split('@')[0],
                email: email
            },
            permissions: {}
        });
    });
};
