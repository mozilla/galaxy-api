'use strict';

var Game = require('./controllers/game');
var User = require('./controllers/user');


module.exports = [

  {method: 'GET', path: '/games', config: Game.all},
  {method: 'POST', path: '/games', config: Game.create},
  {method: 'GET', path: '/games/{idOrSlug}', config: Game.get},
  {method: 'DELETE', path: '/games/{idOrSlug}', config: Game.remove},
  {method: 'PUT', path: '/games/{idOrSlug}', config: Game.update},

  {method: 'GET', path: '/auth/steam', config: User.steamAuthenticate},
  {method: 'GET', path: '/auth/steam/verify', config: User.steamVerify}
];
