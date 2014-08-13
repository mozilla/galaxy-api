# galaxy-api

Here lies the REST API for [Galaxy](https://github.com/mozilla/galaxy).


## Installation

To install dependencies:

    npm install

Node 0.11.x is required for the `--harmony` flag which enables generators (required for Koa, the web framework). If you're running an earlier version of Node you may install [n](https://github.com/visionmedia/n), a node version manager to quickly install 0.11.x:

    npm install -g n
    n 0.11.12


## Development

To run the local web server:

    nodemon --harmony bin/api

Alternatively:

    npm run-script dev

To run linting tools:

    gulp lint


## Production

Node 0.11.x is required for the `--harmony` flag which enables generators (required for Koa, the web framework).

To run the web server in production:

    node --harmony bin/api

Alternatively:

    npm run-script prod


## Testing

    npm test


## Deployment

To run the local web server:

    node --harmony bin/api

Alternatively:

    npm start
