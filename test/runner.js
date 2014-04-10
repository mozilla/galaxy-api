/*
 
    Usage:

        npm test

*/


var _ = require('lodash');
var child_process = require('child_process');
var path = require('path');
var url = require('url');

var async = require('async');

var settings = require('../settings_test');


const SERVER_LAUNCH_TIMEOUT = 1000;

var servers = [];

// Cleanup code
function killServers() {
    console.log('Cleaning up...');
    process.removeAllListeners();
    servers.forEach(function(server) {
        console.log('Killing pid', server.proc.pid, ':', server.cmd, server.args.join(' '));
        server.proc.removeAllListeners();
        server.proc.kill();
    });
    servers = [];
}

process.on('exit', function(code) {
    killServers();
});

process.on('uncaughtException', function(e) {
    console.log('Uncaught Exception:', e);
    process.exit(1);
});


function launchServer(cmd, args, timeout, env) {
    if (typeof(timeout) === 'undefined') {
        timeout = SERVER_LAUNCH_TIMEOUT;
    }
    
    // '' still evalutes to false, but the console
    // log looks nicer
    if (typeof(env) === 'undefined') {
        env = '';
    }

    return function(done) {
        console.log('Launching:', env, cmd, args.join(' '), '(wait', timeout, 'ms)')

        env = env ? _.extend(process.env, env) : process.env;
        var server = child_process.spawn(cmd, args, {env: env});

        // If this timeout function is executed, it means that 
        // the server instance has not terminated within the time
        // interval. We assume that the server has launched successfully
        var successTimeout = setTimeout(function() {
            servers.push({cmd: cmd, args: args, timeout: timeout, env: env, proc: server});
            done();
        }, SERVER_LAUNCH_TIMEOUT);

        server.on('exit', function(code) {
            if (servers.indexOf(server) > -1) {
                // This means the error happen after the process has been launched
                
                // Remove self from the server list because we might accidentlly kill
                // another process with the same pid (rare)
                servers.splice(servers.indexOf(server));
            } else {
                // Set timeout is not active yet, so we clear it
                clearTimeout(successTimeout);
            }
            var error = cmd + ' terminated with status code ' + code;
            throw new Error(error);
        });
    }
}

function launchRedis(port, timeout) {
    return launchServer('redis-server', ['--port', port], timeout);
}

function launchPersonaFaker(port, timeout) {
    return launchServer('node', ['node_modules/persona-faker/app.js'], timeout, {PORT: port});
}


function unitTest(file) {
    return function(done) {
        console.log('Executing unit test:', file);

        process.env.NODE_ENV = 'test';
        var mocha_bin = ['node_modules', '.bin', 'mocha'].join(path.sep);   

        file = ['test', 'lib', file].join(path.sep);
        var mochaProc = child_process.spawn(mocha_bin, ['--reporter', 'list', file]);
        // We want to pipe the test result to stdout/stderr so we can see the outcome
        // of the test
        mochaProc.stdout.pipe(process.stdout);
        mochaProc.stderr.pipe(process.stderr);
        mochaProc.on('error', function(error) { 
            done(error);
        });

        mochaProc.on('exit', function(code) {
            done();
        });
    }
}


var redis_port = url.parse(settings.REDIS_TEST_URL || '').port || 6380;
var persona_faker_port = url.parse(settings.PERSONA_FAKER_TEST_URL || '').port || 9009;


// Add additional
var tasks = [launchRedis(redis_port),
             launchPersonaFaker(persona_faker_port),
             unitTest('user.js')];

async.series(tasks, function (error) {
    if (error) {
        throw(error);
    }
    console.log('Execution complete!');
    killServers();
});
