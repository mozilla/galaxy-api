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

    npm run dev

To run linting tools:

    gulp lint


## Production

Initialise settings if you haven't already:

    cp ./settings_prod.js.dist ./settings_prod.js

Set these environment variables:

    NODE_ENV=production
    GALAXY_API_SETTINGS=./settings_prod.js

To run the web server in production:

    node index.js

Alternatively:

    npm run prod


## Testing

Initialise settings:

    cp ./settings_test.js.dist ./settings_test.js

To run tests:

    npm test

To run tests without destroying the database first:

    npm run test-keepdb

To run tests with coverage and linting:

    npm run test-verbose


## Database

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
