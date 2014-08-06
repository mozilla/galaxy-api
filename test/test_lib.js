// Note: Because this code deals with spawning and killing process, it is actually
// kinda fragile. Do take care when you modify this file: any error that happens during
// development might lead to orphaned child processes!

var _ = require('lodash');
var child_process = require('child_process');
var path = require('path');

var async = require('async');


const DEFAULT_SERVER_LAUNCH_TIMEOUT = 1000;

var servers = [];

function redis(port, timeout) {
    return server('redis-server', ['--port', port], timeout);
}
exports.redis = redis;


function personaFaker(port, timeout) {
    var appPath = ['node_modules', 'persona-faker', 'app.js'].join(path.sep);
    return server('node', [appPath], timeout, {PORT: port});
}
exports.personaFaker = personaFaker;


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
            if (code !== 0) {
                var error = file + ' failed';
                throw new Error(error);
            }
            done();
        });
    }
}
exports.unitTest = unitTest;


function run(servers, tests) {
    var tasks = servers.concat(tests);
    async.series(tasks, function (error) {
        if (error) {
            throw(error);
        }
        console.log('Execution complete!');
        killServers();
    });
}
exports.run = run;


function server(cmd, args, timeout, env) {
    if (typeof(timeout) === 'undefined') {
        timeout = DEFAULT_SERVER_LAUNCH_TIMEOUT;
    }
    
    // '' also evaluates to false, but the console
    // log looks nicer
    if (typeof(env) === 'undefined') {
        env = '';
    }

    return function(done) {
        console.log('Launching:', env, cmd, args.join(' '), '(waiting', timeout, 'ms)')

        env = env ? _.extend(process.env, env) : process.env;
        var server = child_process.spawn(cmd, args, {env: env});

        // If this timeout function is executed, it means that 
        // the server instance has not terminated within the time
        // interval. We assume that the server has launched successfully
        var successTimeout = setTimeout(function() {
            servers.push({cmd: cmd, args: args, timeout: timeout, env: env, proc: server});
            done();
        }, DEFAULT_SERVER_LAUNCH_TIMEOUT);

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

process.on('uncaughtException', function(error) {
    console.log('Uncaught Exception:', error);
    process.exit(1);
});
