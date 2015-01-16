'use strict';

var Game = require('./controllers/game');
var User = require('./controllers/user');


module.exports = function (server) {

  var route = server.route;

  route({method: 'GET', path: '/games', config: Game.all});
  route({method: 'POST', path: '/games', config: Game.create});
  route({method: 'GET', path: '/games/{idOrSlug}', config: Game.get});
  route({method: 'DELETE', path: '/games/{idOrSlug}', config: Game.remove});
  route({method: 'PUT', path: '/games/{idOrSlug}', config: Game.update});

  route({method: 'POST', path: '/user/login', config: User.login});
};
