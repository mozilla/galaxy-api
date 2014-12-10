var gameController = require('./controllers/game.js');


module.exports = function (server) {
  server.route({
    method: 'GET',
    path: '/games',
    handler: function (request, reply) {
      reply(gameController.get());
    }
  });
};
