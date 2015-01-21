'use strict';
var HapiPassport = require('hapi-passport');
var SteamStrategy = require('passport-steam').Strategy;

var settings = require('../../settings');
var User = require('../models/user');
var utils = require('../../lib/utils');


var strategy = new SteamStrategy({
  returnURL: 'http://localhost:4000/auth/steam/return',
  realm: 'http://localhost:4000/',
  apiKey: settings.STEAM_KEY
}, function (identifier, profile, done) {

  console.log('Finding user by Open ID identifier:', identifier);

  User.objects.get({openId: identifier}, function (err, user) {

    return done(err, user);
  });
});

var steamLogin = HapiPassport(strategy);


// `GET /auth/steam`
//   Use passport.authenticate() as route middleware to authenticate the
//   request. The first step in Steam authentication will involve redirecting
//   the user to Steam's server. After authenticating, Steam will redirect the
//   user back to this application at ``/auth/steam/return`.
exports.steamAuth = {
  handler: steamLogin({
    onSuccess: function (info, request, reply) {
      console.log('Steam auth success:', info);
    },
    onFailed: function (warning, request, reply) {
      console.log('Steam auth failure:', warning);
    },
    onError: function (error, request, reply) {
      console.log('Steam auth error:', error);
    }
  })
};


// `GET /auth/steam/return`
//   Use `passport.authenticate()` as the route middleware to authenticate the
//   request. If authentication fails, the user will be redirected back to the
//   login page. Otherwise, the primary route function function will be
//   called, which, in this example, will redirect the user to the homepage.
exports.steamReturn = {
  handler: utils.safeHandler(function (request, reply) {

    console.log('steam return');

  })
};
