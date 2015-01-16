'use strict';

var Game = require('./controllers/game');
var User = require('./controllers/user');


module.exports = function (server) {


  server.route({
    method: 'GET',
    path: '/games',
    config: Game.all
  });


  server.route({
    method: 'POST',
    path: '/games',
    config: Game.create
  });


  server.route({
    method: 'GET',
    path: '/games/{idOrSlug}',
    config: Game.get
  });


  server.route({
    method: 'DELETE',
    path: '/games/{idOrSlug}',
    config: Game.remove
  });


  server.route({
    method: 'PUT',
    path: '/games/{idOrSlug}',
    config: Game.update
  });


  server.route({
    method: 'POST',
    path: '/user/login',
    config: User.login
  });
};
