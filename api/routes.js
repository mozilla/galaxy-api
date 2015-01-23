'use strict';

var Game = require('./controllers/game');
var User = require('./controllers/user');


module.exports = [

  {method: 'GET', path: '/games', config: Game.all},
  {method: 'POST', path: '/games', config: Game.create},
  {method: 'GET', path: '/games/{uuidOrSlug}', config: Game.get},
  {method: 'DELETE', path: '/games/{uuidOrSlug}', config: Game.remove},
  {method: 'PUT', path: '/games/{uuidOrSlug}', config: Game.update},

  {method: 'POST', path: '/user/login', config: User.login}
];
