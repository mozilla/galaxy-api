'use strict';
var openid = require('openid');
var SteamStrategy = require('passport-steam').Strategy;

var settings = require('../../settings');
var User = require('../models/user');
var utils = require('../../lib/utils');


var relyingParty = new openid.RelyingParty(
  'http://localhost:4000/auth/steam/verify',  // Verification URL (yours)
  'http://localhost:4000',  // Realm (optional, specifies realm for OpenID authentication)
  true,  // Steam works as only stateless OpenID
  false,  // Strict mode
  []);  // List of extensions to enable and include



// `GET /auth/steam`
//   Authenticate the request. The first step in Steam authentication will
//   involve redirecting the user to Steam's server. After authenticating,
//   Steam will redirect the user to `/auth/steam/verify`.
exports.steamAuthenticate = {
  handler: function (request, reply) {

    var identifier = settings.STEAM_PROVIDER_URL;

    if (!identifier) {
      return reply(utils.errors.ValidationError('No identifier passed'));
    }

    // TODO: check if there is a user with this identifier!
    // if (!openidExists(identifier)) {
    //   return reply(utils.errors.ValidationError('Bad identifier'));
    // }

    relyingParty.authenticate(identifier, false, function (err, authUrl) {

      if (err) {
        return reply(utils.errors.ValidationError(err.message));
      }

      if (!authUrl) {
        return reply(
          utils.errors.ValidationError('No authentication URL retrieved'));
      }

      // No point in redirecting to this URL since this route gets called via XHR.
      reply({authUrl: authUrl});
    });
  }
};


// `GET /auth/steam/return`
//   If authentication fails, the user will be redirected back to the log-in
//   page. Otherwise, the user is redirected to the homepage.
exports.steamVerify = {
  handler: function (request, reply) {

    relyingParty.verifyAssertion(request.raw.req, function (err, result) {

      reply({success: !err && result.authenticated});
    });

  }
};
