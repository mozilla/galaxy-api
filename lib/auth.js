var crypto = require('crypto');

var uuid = require('node-uuid');
var request = require('request');

var settings = require('../settings');
var settings_local = require('../settings_local');


const PERSONA_VERIFICATION_URL = 'https://verifier.login.persona.org/verify';


function verifyPersonaAssertion(assertion, audience, callback) {
    /*
    `callback` will be called with an error (if it occurs) and a JS
    object containing the resulting data from Persona (if it is available).
    */
    console.log({
        assertion: assertion,
        audience: settings_local.DEBUG ? audience : settings.origin
    });
    var req = request.post({
        url: PERSONA_VERIFICATION_URL,
        form: {
            assertion: assertion,
            audience: settings_local.DEBUG ? audience : settings.origin
        }
    }, function(err, resp, body) {
        if (err) {
            callback('Connection to verification server failed.', null);
            return;
        }
        var json_resp = JSON.parse(body);
        if (json_resp.status !== 'okay') {
            callback('Assertion verification failed.', null);
            return;
        }
        callback(null, json_resp);
    });
}
exports.verifyPersonaAssertion = verifyPersonaAssertion;

function _userID(email) {
    return crypto.createHash('sha1').update(email + settings_local.SECRET).digest('hex');
}

function _hmac(key, value) {
    return crypto.createHmac('sha512', key + settings_local.SECRET).update(value).digest('hex');
}

function createSSA(email) {
    var guid = uuid.v4();
    var userID = _userID(email);
    return _hmac(guid, userID) + ',' + guid + ',' + email
}
exports.createSSA = createSSA;

function verifySSA(token) {
    var tokenBits;
    try {
        tokenBits = token.split(',', 3);
    } catch(e) {
        return false;
    }
    if (tokenBits.length !== 3) return false;

    var guid = tokenBits[1];
    var email = tokenBits[2];
    var userID = _userID(email);

    return (tokenBits[0] === _hmac(guid, userID)) ? email : false;
}
exports.verifySSA = verifySSA;
