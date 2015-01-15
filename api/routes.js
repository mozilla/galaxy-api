'use strict';

var Game = require('./controllers/game');


module.exports = function (server) {


  /*

  Sample usage:

    curl 'http://localhost:4000/games' -i

  */
  server.route({
    method: 'GET',
    path: '/games',
    config: Game.all
  });


  /*

  Sample usage:

    curl -X POST 'http://localhost:4000/games' \
      -H 'Content-Type: application/json' -i -d@- <<EOF
      {
        "name": "mario bros",
        "game_url": "http://nintendo.com",
        "slug": "mario"
      }
EOF

  */
  server.route({
    method: 'POST',
    path: '/games',
    config: Game.create
  });


  /*

  Sample usage:

    curl 'http://localhost:4000/games/1' -i

    curl 'http://localhost:4000/games/mario' -i

  */
  server.route({
    method: 'GET',
    path: '/games/{idOrSlug}',
    config: Game.get
  });


  /*

  Sample usage:

    curl -X DELETE 'http://localhost:4000/games/1' -i
    curl -X DELETE 'http://localhost:4000/games/mario' -i

  */
  server.route({
    method: 'DELETE',
    path: '/games/{idOrSlug}',
    config: Game.remove
  });


  /*

  Sample usage:

    curl -X PUT 'http://localhost:4000/games/1' \
      -H 'Content-Type: application/json' -i -d@- <<EOF
      {
        "name": "mario bros",
        "game_url": "http://nintendo.com",
        "slug": "mario"
      }
EOF

    curl -X PUT 'http://localhost:4000/games/mario' \
      -H 'Content-Type: application/json' -i -d@- <<EOF
      {
        "name": "mario bros",
        "game_url": "http://nintendo.com",
        "slug": "mario"
      }
EOF

    curl -X PUT 'http://localhost:4000/games/wario' \
      -H 'Content-Type: application/json' -i -d@- <<EOF
      {
        "name": "wario bros",
        "game_url": "http://wintendo.com",
        "slug": "wario"
      }
EOF

  */
  server.route({
    method: 'PUT',
    path: '/games/{idOrSlug}',
    config: Game.update
  });
};
