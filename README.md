![galaxy-api logo](images/logo.png?raw=true)

[![Build Status](https://travis-ci.org/mozilla/galaxy-api.svg?branch=master)](https://travis-ci.org/mozilla/galaxy-api "Build Status")

Here lies the API for [Galaxy](https://github.com/mozilla/galaxy).

There is a REST HTTP API and WebSocket API. The REST API can be consumed by game developers. The WebSocket API is intended to be consumed by [galaxy.js](https://github.com/mozilla/galaxy.js), a simple drop-in JavaScript API for multiplayer, web-based games.

> __Note:__ This project is not ready for prime time. Not an official Mozilla project. Pre-alpha everything. Anything and everything at your own risk.


## Installation

To install dependencies:

    npm install

Other dependencies:

* PostgreSQL (`brew install postgresql && brew info postgresql` using [Homebrew](http://brew.sh/) on Mac OS X)

Create a PostgreSQL database:

    createdb galaxy-api


## Development

Initialise settings, if you haven't already:

    cp ./settings_dev.js.dist ./settings_dev.js

Set these environment variables:

    NODE_ENV=development
    GALAXY_API_SETTINGS=./settings_dev.js

To run the local web server:

    nodemon index.js

Alternatively:

    npm run-script dev

To run linting tools:

    gulp lint

To access the PostgreSQL prompt:

    psql


## Production

Initialise settings if you haven't already:

    cp ./settings_prod.js.dist ./settings_prod.js

Set these environment variables:

    NODE_ENV=production
    GALAXY_API_SETTINGS=./settings_prod.js

To run the web server in production:

    node index.js

Alternatively:

    npm run-script prod


## Testing

Initialise settings:

    cp ./settings_test.js.dist ./settings_test.js

Set these environment variables:

    NODE_ENV=test
    GALAXY_API_SETTINGS=./settings_test.js

To run tests:

    npm test
