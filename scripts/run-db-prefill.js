#!/usr/bin/env node

/*
    Usage: ./scripts/run-db-prefill.js
 */

var db = require('../db');
var prefill = require('./db-prefill');
var settings_local = require('../settings_local');

var client = db.redis();
client.on('ready', function() {
    if (settings_local.FLUSH_DB_ON_PREFILL) {
        // FIXME: this doesn't work when the script is called
        // from outside the root directory for some reason
        console.log('flushing db...');
        client.flushdb(prefill.run);
    } else {
        prefill.run(client);
    }
});
