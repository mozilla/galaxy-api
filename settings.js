var settings_local = require(process.env.GALAXY_API_SETTINGS || './settings_local.js');

exports.DEBUG=''
exports.ORIGIN = 'https://api.galaxy.mozilla.org';
exports.PERSONA_VERIFICATION_URL = 'https://verifier.login.persona.org/verify';
exports.PORT = 5000;
exports.REDIS_URL = 'redis://localhost:6379';
exports.SECRET = 'a secret string'

for(var k in settings_local) {
    exports[k] = settings_local[k];
}
