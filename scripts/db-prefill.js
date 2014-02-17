var child_process = require('child_process');
var path = require('path');
var stream = require('stream');

var _ = require('lodash');
var request = require('request');
var Promise = require('es6-promise').Promise;

var db = require('../db');
var settings = require('../settings');
var settings_local = require('../settings_local');
var utils = require('../lib/utils');

const PERSONA_PORT = '9009';
const PERSONA_ENDPOINT = 'http://localhost:' + PERSONA_PORT;
const PERSONA_PATH = 'node_modules/persona-faker/app.js';

const API_PORT = '5009';
const API_ENDPOINT = 'http://localhost:' + API_PORT;

const PREFILL_NAMESPACE = 'galaxy-db-prefill';
const SIGNAL_NAMES = ['api', 'persona-faker'];

const USER_COUNT = 100;
const FAKE_GAMES = [
    {
        name: 'Mario Broskis',
        app_url: 'http://mario.broskis'
    }, 
    {
        name: 'Halo 718',
        app_url: 'http://halo.com'
    },
    {
        name: 'Left 5 Dead',
        app_url: 'http://dead.left'
    }
];

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

var client = db.redis();
client.on('ready', function() {
    if (settings_local.FLUSH_DB_ON_PREFILL) {
        // FIXME: this doesn't work when the script is called
        // from outside the root directory for some reason
        console.log('flushing db...');
        client.flushdb(run);
    } else {
        run();
    }
});

function run() {
    var ready_promise = new Promise(function(resolve, reject) {
        // Transform signal names into an object with those keys
        // so that we can cleanly lookup and delete them
        var remaining_signals = _.object(SIGNAL_NAMES.map(function(x) { return [x, true]; } ));

        var timeout = setTimeout(function() {
            reject('Server(s) [' + Object.keys(remaining_signals) + '] did not call back in time!');
        }, 5000);
        client.on('pmessage', function(pattern, channel, message) {
            var channel_info = channel.split(':');
            var namespace = channel_info[0];
            if (namespace !== PREFILL_NAMESPACE) {
                return;
            }

            var source = channel_info[1];
            if (remaining_signals[source]) {
                console.log(source, 'is ready');
                delete remaining_signals[source];
                if (!Object.keys(remaining_signals).length) {
                    clearTimeout(timeout);
                    resolve();
                }
            }
        }).psubscribe(PREFILL_NAMESPACE + ':*');
        console.log('waiting for servers to finish launching...');
    }).then(function(result) {
        console.log('starting prefill...');
        startRequests();
    }).catch(function(err) {
        console.error(err);
        process.exit(1);
    });

    var child_procs = [];
    process.on('exit', function() {
        child_procs.forEach(function(child) {
            // Need to use SIGINT because SIGTERM won't actually terminate a node process
            // so long as its HTTP server is still running
            child.kill('SIGINT');
        });
    });

    // Use a callback so that if we crash for some reason after setting up one server but
    // before finishing the next, we can still kill the processes that we had started
    startServers(function(proc) {
        child_procs.push(proc);
    });

    function startServers(callback) {
        function startServer(serverPath, opts) {
            var proc = child_process.spawn('node', [serverPath], {
                cwd: path.dirname(__dirname),
                env: _.extend({
                    DB_PREFILL: true,
                    PATH: process.env.PATH,
                    PORT: opts.port
                }, opts.env || {}),
                stdio: ['ignore', 'pipe', 'pipe']
            }).on('error', function(err) {
                console.error('error running ' + opts.name + ':', err);
            }).on('close', function(code, signal) {
                console.log(opts.name, 'process closed');
            });

            // TODO: Should we even bother outputting stdout?
            ['stdout', 'stderr'].forEach(function(sname) {
                var std_stream = new NamedWritable(opts.name, process[sname]);
                proc[sname].pipe(std_stream);
            });

            console.log('running', opts.name, '(pid: ' + proc.pid + ') on port', opts.port);
            return proc;
        }

        callback(startServer(PERSONA_PATH, {
            name: 'persona-faker', 
            port: PERSONA_PORT
        }));
        callback(startServer('app.js', {
            name: 'galaxy-api',
            port: API_PORT,
            env: {
                PERSONA_VERIFICATION_URL: PERSONA_ENDPOINT + '/verify'
            }
        }));
    }

    function startRequests() {
        utils.promiseMap({
            users: createUsers(), 
            games: createGames()
        }).then(function(result) {
            var gameSlugs = result.games.map(function(json) { return json.slug; });
            var userSSAs = result.users.map(function(user) { return user.token; });

            var purchasePromise = purchaseGames(userSSAs, gameSlugs);
            var friendsPromise = createFriends(result.users);

            return utils.promiseMap({
                friends: friendsPromise,
                purchases: purchasePromise
            });
        }).then(function(result) {
            // TODO: log some form of useful output
            console.log('Finished generating users, games, purchases and friend requests.');
            process.exit(0);
        }).catch(function(err) {
            console.error(err);
            process.exit(1);
        });
    };
}

/*** Prefill Logic ***/

function createUsers() {
    function createUser(email) {
        return postPromise(PERSONA_ENDPOINT + '/generate', {
            email: email
        });
    };

    function login(emailAssertion) {
        return new Promise(function(resolve, reject) {
            var assertion = emailAssertion.assertion;
            postPromise(API_ENDPOINT + '/user/login', {
                assertion: assertion,
                audience: API_ENDPOINT
            }).then(function(result) {
                if (result.error) {
                    return reject('Login failed: ' + result.error);
                }
                resolve({
                    email: result.settings.email,
                    token: result.token,
                    username: result.public.username,
                    id: result.public.id
                });
            });
        });
    };

    return Promise.all(_.times(USER_COUNT, function(i) {
        return createUser('test' + i + '@test.com').then(login);
    }));
}

function createGames() {
    var default_params = {
        icons: '128',
        screenshots: 'yes'
    };

    return Promise.all(FAKE_GAMES.map(function(game) {
        return postPromise(API_ENDPOINT + '/game/submit',
            _.defaults(game, default_params));
    }));
}

function purchaseGames(userSSAs, gameSlugs) {
    var promises = _.flatten(userSSAs.map(function(user) {
        return _.sample(gameSlugs, 2).map(function(game) {
            return newPurchase(user, game);
        });
    }));

    function newPurchase(user, game) {
        return postPromise(API_ENDPOINT + '/user/purchase', {
            _user: user,
            game: game
        });
    }

    return Promise.all(promises);
}

function createFriends(users) {
    function sendRequests(user) {
        var recipients = _.sample(users, Math.min(3, USER_COUNT));
        var promises = recipients.map(function(recipient){
            return sendRequest(user, recipient);
        });
        return Promise.all(promises);
    }

    function sendRequest(user, recipient) {
        return new Promise(function(resolve, reject) {
            return postPromise(API_ENDPOINT + '/user/friends/request', {
                _user: user.token,
                recipient: recipient.id
            }).then(function(result) {
                if (result.error) {
                    if (_.contains(['already_friends', 'already_requested'], result.error)) {
                        console.log('Friend request warning:', result.error);
                        return resolve({});
                    }
                    return reject(result.error);
                }
                
                resolve({
                    user: user,
                    recipient: recipient
                });
            });
        });
    }

    function acceptRequest(friendRequest) {
        function done() {
            return new Promise(function(resolve, reject) {
                resolve({
                    user: friendRequest.user,
                    recipient: friendRequest.recipient
                });
            });
        }
        if (!friendRequest.user || !friendRequest.recipient) {
            // silently ignore acceptable errors
            // TODO: create a mechanism to avoid redundant friend requests
            // (we randomly pick users to friend, so A can friend B, then B can friend A later)
            return done();
        }
        return new Promise(function(resolve, reject) {
            postPromise(API_ENDPOINT + '/user/friends/accept', {
                _user: friendRequest.recipient.token,
                acceptee: friendRequest.user.id
            }).then(function(result) {
                if (result.error) {
                    reject('Friend accept failed: ' + result.error);
                    return;
                }
                resolve(done());
            });
        });
    }

    var promises = users.map(function(user) {
        return sendRequests(user).then(function(requests) {
            return Promise.all(requests.map(acceptRequest));
        });
    });
    return Promise.all(promises).then(_.flatten);
}

// Helper function that returns a promise for a post
function postPromise(url, form) {
    return new Promise(function(resolve, reject) {
        request.post({
            url: url,
            form: form
        }, function(err, resp, body) {
            if (err) {
                reject(err);
                return;
            }
            resolve(JSON.parse(body));
        });
    });
}
