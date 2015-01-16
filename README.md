![galaxy-api](images/logo.png?raw=true "galaxy-api")

[![Build Status](https://travis-ci.org/mozilla/galaxy-api.svg?branch=master)](https://travis-ci.org/mozilla/galaxy-api "Build Status")

Here lies the API for [Galaxy](https://github.com/mozilla/galaxy).

There is a REST HTTP API and WebSocket API. The REST API can be consumed by game developers. The WebSocket API is intended to be consumed by [galaxy.js](https://github.com/mozilla/galaxy.js), a simple drop-in JavaScript API for multiplayer, web-based games.

> __Note:__ This project is not ready for prime time. Not an official Mozilla project. Pre-alpha everything. Anything and everything at your own risk.


## Installation

1. Ensure prerequisities are installed:

    * [__PostgreSQL__](http://www.postgresql.org/)

	    To install using [Homebrew](http://brew.sh/) on Mac OS X:

            brew install postgresql
            brew info postgresql

2. Install Node dependencies:

        npm install

    These production dependencies will be installed:

    * [__hapi__](https://github.com/hapijs/hapi):
    a simple framework for developing web services + APIs
        * [__boom__](https://github.com/hapijs/boom):
        utilities for returning HTTP errors
        * [__joi__](https://github.com/hapijs/joi):
        schema validator for JS objects and API request payloads
    * [__pg__](https://github.com/brianc/node-postgres):
    a PostgreSQL client with pure JS and optional native libpq bindings
        * [__node-pg-migrate__](https://github.com/theoephraim/node-pg-migrate):
        a tool for PostgreSQL migrations
    * [__es6-promise__](https://github.com/jakearchibald/es6-promise):
    to polyfill ES6 promises for Node, so we can avoid callbacks
    * [__steam__](https://github.com/seishun/node-steam):
    wrapper around [Steam](http://store.steampowered.com/)'s
    [HTTP API](http://steamcommunity.com/dev) (can be used for authentication
    and friends)

    And these developer dependencies will be installed:

    * [__lab__](https://github.com/hapijs/lab):
    a test utility for Node, synergises well with hapi
    * [__gulp__](https://github.com/gulpjs/gulp/):
    a streaming build system and task runner — used for such tasks as
    code linting and running database migrations & operations.
    * [a bunch of related packages for build tasks](package.json)

3. Create a PostgreSQL database (using `settings.POSTGRES_URL` from `settings_dev.js`):

        npm run refreshdb-dev

4. Initialise settings, if you haven't already:

        cp ./settings_dev.js.dist ./settings_dev.js
        cp ./settings_prod.js.dist ./settings_prod.js
        cp ./settings_test.js.dist ./settings_test.js


## Developing locally

Initialise settings, if you haven't already:

    cp ./settings_dev.js.dist ./settings_dev.js

To run the local web server:

    npm run dev

To run with a different settings file:

    GALAXY_API_SETTINGS=./some_different_settings_dev.js npm run prod

    npm run gulp -- lint

To run linting tools:

    gulp lint


## Deploying to production

Initialise settings, if you haven't already:

    cp ./settings_prod.js.dist ./settings_prod.js

To run the web server in production:

    npm run prod

To run with a different settings file:

    GALAXY_API_SETTINGS=./some_different_settings_prod.js npm run prod

Alternatively, without `npm`:

    NODE_ENV=production GALAXY_API_SETTINGS=./settings_prod.js node index.js
    NODE_ENV=production GALAXY_API_SETTINGS=./some_different_settings_prod.js node index.js


## Running tests

Initialise settings, if you haven't already:

    cp ./settings_test.js.dist ./settings_test.js

To run tests:

    npm test

To run a single test:

    npm test -- test/lib/db.js

To run tests without destroying the database first:

    npm run test-keepdb

To run tests with coverage and linting:

    npm run test-verbose


## Working with the database

All data is currently stored in a relational PostgreSQL database (previously redis was used).

### `gulp` tasks

These are the available `gulp` tasks for PostgreSQL database and migration operations:

* `gulp createdb` - create a PostgreSQL database using `settings.POSTGRES_URL`.
* `gulp dropdb` - delete the database.
* `gulp migratedb` - run migrations.
* `gulp migratedb-create --name <name>` - create a new migration file called `<name>`.
* `gulp migratedb-up` - run all up migrations from the current state.
* `gulp migratedb-up --num <num>` - run `<num>` up migrations from the current state.
* `gulp migratedb-down` - run a single down migration.
* `gulp migratedb-down --num <num>` - run `<num>` down migrations from the current state.

### `psql` commands

To access the PostgreSQL prompt:

    psql -d galaxy-api

These are a few helpful PostgreSQL commands:

* `\h` - view list of available commands.
* `\dt+` - list all tables in the database.
* `\d+ <table_name>` - show a table's schema.
* `drop table <table_name>` - delete a table.
* `\x on` - view a table in "extended display" mode.


## Examples of using the API

Below are sample `curl` commands for interacting with the REST API endpoints.

NOTE: This should eventually also live elsewhere in the real API docs, but for
now: it's fine; it's fine.

[gameControllers]:
https://github.com/mozilla/galaxy-api/blob/master/api/controllers/game.js

### Games

#### [`GET /games`] [gameControllers]

To retrieve a list of all game resources.

    curl 'http://localhost:4000/games' \
      -H 'Content-Type: application/json' -i

#### [`POST /games`] [gameControllers]

To create a game resource.

  curl -X POST 'http://localhost:4000/games' \
    -H 'Content-Type: application/json' -i -d@- <<EOF
    {
      "name": "mario bros",
      "game_url": "http://nintendo.com",
      "slug": "mario"
    }
    EOF

#### [`GET /games/{idOrSlug}`] [gameControllers]

To retrieve a game resource.

    curl 'http://localhost:4000/games/1' \
      -H 'Content-Type: application/json' -i

    curl 'http://localhost:4000/games/mario' \
      -H 'Content-Type: application/json' -i

#### [`DELETE /games/{idOrSlug}`] [gameControllers]

To (soft-)delete a game resource.

    curl -X DELETE 'http://localhost:4000/games/1' -i
    curl -X DELETE 'http://localhost:4000/games/mario' -i

#### [`PUT /games/{idOrSlug}`] [gameControllers]

To update a game resource.

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
