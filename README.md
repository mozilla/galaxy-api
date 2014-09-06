![galaxy-api logo](images/logo.png?raw=true)

Here lies the API for [Galaxy](https://github.com/mozilla/galaxy).

There is a REST HTTP API and WebSocket API. The REST API can be consumed by game developers. The WebSocket API is intended to be consumed by [galaxy.js](https://github.com/mozilla/galaxy.js), a simple drop-in JavaScript API for multiplayer, web-based games.


## Installation

To install dependencies:

    npm install

Node 0.11.x is required for the `--harmony` flag which enables generators (required for Koa, the web framework). If you're running an earlier version of Node you may install [n](https://github.com/visionmedia/n), a node version manager to quickly install 0.11.x:

    npm install -g n
    n 0.11.12


## Development

Initialise settings, if you haven't already:

    cp ./settings_local.js.dist ./settings_local.js

Set these environment variables:

    NODE_ENV=development
    GALAXY_API_SETTINGS=./settings_local.js

To run the local web server:

    nodemon --harmony bin/api

Alternatively:

    npm run-script dev

To run linting tools:

    gulp lint


## Production

Initialise settings if you haven't already:

    cp ./settings_prod.js.dist ./settings_prod.js

Set these environment variables:

    NODE_ENV=production
    GALAXY_API_SETTINGS=./settings_prod.js

Node 0.11.x is required for the `--harmony` flag which enables generators (required for Koa, the web framework).

To run the web server in production:

    node --harmony bin/api

Alternatively:

    npm run-script prod


## Testing

Initialise settings:

    cp ./settings_local.js.dist ./settings_local.js

Set these environment variables:

    NODE_ENV=test
    GALAXY_API_SETTINGS=./settings_test.js

To run tests:

    npm test


## Deployment

To run the local web server:

    node --harmony bin/api

Alternatively:

    npm start
