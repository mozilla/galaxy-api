var child_process = require('child_process');
var request = require('request');
var path = require('path');
var stream = require('stream');

var _ = require('lodash');

const API_PORT = '5055';

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
        port: API_PORT,
        env: {
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

    // TODO: have verbose option?
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

function postJSON(endpoint, body, callback) {
    var options = {
        // TODO: get the actual address from the server?
        uri: 'http://0.0.0.0:' + API_PORT + "/" + endpoint,
        method: 'POST',
        json: body
    };

    request(options, function (error, response, body) {
        callback(error, body);
    });
}
exports.postJSON = postJSON;
