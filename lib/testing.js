var _ = require('lodash');
var child_process = require('child_process');
var path = require('path');
var request = require('request');
var settings = require('../settings_test');
var stream = require('stream');

// A stream.Writable subclass that forwards to another stream after
// prefixing each chunk with the provided name
function NamedWritable(name, forwardingStream) {
    stream.Writable.call(this, {decodeStrings: false});
    this.forwardingStream = forwardingStream;
    this.name = name;
}
NamedWritable.prototype = new stream.Writable;
NamedWritable.prototype._write = function(chunk, encoding, callback) {
    if (this.forwardingStream) {
        this.forwardingStream.write(this.name + ': ' + chunk);
    }
    callback();
};

function startTestServer(verbose) {
    var opts = {
        name: 'galaxy-api',
        port: settings.API_TEST_PORT,
        env: {
            PERSONA_VERIFICATION_URL: settings.PERSONA_VERIFICATION_URL,
            TEST_MODE: true
        }};
    var proc = child_process.spawn('node', ['app.js'], {
        cwd: path.dirname(__dirname),
        env: _.extend({
            PATH: process.env.PATH,
            PORT: opts.port
        }, opts.env || {}),
        stdio: ['ignore', 'pipe', 'pipe']
    }).on('error', function(err) {
        console.error('error running ' + opts.name + ':', err);
    }).on('close', function(code, signal) {
        console.log(opts.name, 'process closed');
    });

    if (verbose) {
        // output stdout and stderr
        ['stdout', 'stderr'].forEach(function(sname) {
            var std_stream = new NamedWritable(opts.name, process[sname]);
            proc[sname].pipe(std_stream);
        });
        console.log('running', opts.name, '(pid: ' + proc.pid + ') on port', opts.port);
    }

    return proc;
}
exports.startTestServer = startTestServer;

function getURLEncoded(endpoint, body, callback) {
    var options = {
        uri: settings.API_TEST_URL + "/" + endpoint,
        method: 'GET',
        form: body
    };

    request(options, function (error, response, body) {
        callback(error, body);
    });
}
exports.getURLEncoded = getURLEncoded;

function postJSON(endpoint, body, callback) {
    var options = {
        uri: settings.API_TEST_URL + "/" + endpoint,
        method: 'POST',
        json: body
    };

    request(options, function (error, response, body) {
        callback(error, body);
    });
}
exports.postJSON = postJSON;

function postURLEncoded(endpoint, body, callback) {
    var options = {
        uri: settings.API_TEST_URL + "/" + endpoint,
        method: 'POST',
        form: body
    };

    request(options, function (error, response, body) {
        callback(error, body);
    });
}
exports.postURLEncoded = postURLEncoded;

function putURLEncoded(endpoint, body, callback) {
    var options = {
        uri: settings.API_TEST_URL + "/" + endpoint,
        method: 'PUT',
        form: body
    };

    request(options, function (error, response, body) {
        callback(error, body);
    });
}
exports.putURLEncoded = putURLEncoded;
