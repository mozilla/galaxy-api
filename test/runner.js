#!/usr/bin/env node

/*
 
    Usage:

        ./test/runner.js
        
        - or -
        
        npm test

*/

var url = require('url');
var settings = require('../settings_test');
var testlib = require('./test_lib');


var redisPort = url.parse(settings.REDIS_TEST_URL || '').port || 6380;
var personaFakerPort = url.parse(settings.PERSONA_FAKER_TEST_URL || '').port || 9009;

// Add servers to be launched before running of tests
var servers = [testlib.redis(redisPort),
               testlib.personaFaker(personaFakerPort)];

// Add tests to be ran here
var tests = [testlib.unitTest('user.js')];


// Launch the server, and run the tests!
testlib.run(servers, tests);
