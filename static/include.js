;(function(exports) {

var origin = window.location.protocol + '//' + window.location.host;
var slice = function(arr) {return Array.prototype.slice.call(arr, 0)};

var ifr = document.createElement('iframe');
ifr.src = 'http://localhost:5000/static/host.html#' + origin;
ifr.style.display = 'none';
document.body.appendChild(ifr);

var Deferred = (function() {

    var PENDING = 'pending';
    var RESOLVED = 'resolved';
    var REJECTED = 'rejected';

    function defer(beforeStart) {
        var _this = this;
        var state = PENDING;

        var doneCBs = [];
        var failCBs = [];

        var closedArgs = [];

        function execute(funcs, args, ctx) {
            for (var i = 0, e; e = funcs[i++];) {
                if (Array.isArray(e)) {
                    execute(e, args, ctx);
                } else {
                    e.apply(ctx || _this, args);
                }
            }
        }

        function closer(list, new_state, ctx) {
            return function() {
                if (state !== PENDING) {
                    return;
                }
                state = new_state;
                var args = slice(arguments);
                execute(list, closedArgs = ctx ? args.slice(1) : args, ctx ? args[0] : _this);
                return _this;
            };
        }

        this.resolve = closer(doneCBs, RESOLVED);
        this.resolveWith = closer(doneCBs, RESOLVED, true);
        this.reject = closer(failCBs, REJECTED);
        this.rejectWith = closer(failCBs, REJECTED, true);

        this.promise = function(obj) {
            obj = obj || {};
            function wrap(instant, cblist) {
                return function(arglist) {
                    var args = slice(arguments);
                    if (state === instant) {
                        execute(args, closedArgs);
                    } else if (state === PENDING) {
                        for (var i = 0, e; e = args[i++];) {
                            cblist.push(e);
                        }
                    }
                    return obj;
                };
            }
            obj.state = function() {return state;};
            obj.done = wrap(RESOLVED, doneCBs);
            obj.fail = wrap(REJECTED, failCBs);
            obj.then = function(doneFilter, failFilter) {
                var def = new defer();
                obj.done(function() {
                    var args = slice(arguments);
                    def.resolveWith.apply(this, [this].concat(doneFilter ? doneFilter.apply(this, args) : args));
                });
                obj.fail(function() {
                    var args = slice(arguments);
                    def.rejectWith.apply(this, [this].concat(failFilter ? failFilter.apply(this, args) : args));
                });
                return def.promise();
            };
            obj.always = function() {
                _this.done.apply(_this, arguments).fail.apply(_this, arguments);
                return obj;
            };
            return obj;
        };

        this.promise(this);

        if (beforeStart) {
            beforeStart.call(this, this);
        }
    }

    return function(func) {return new defer(func)};
})();

Deferred.when = this.when = function() {
    var args = slice(arguments);
    if (args.length === 1 && args[0].promise) {
        return args[0].promise();
    }
    var out = [];
    var def = this.Deferred();
    var count = 0;
    for (var i = 0, e; e = args[i];) {
        if (!e.promise) {
            out[i++] = e;
            continue;
        }
        count++;
        (function(i) {
            e.fail(def.reject).done(function() {
                count--;
                out[i] = slice(arguments);
                if (!count) {
                    def.resolve.apply(def, out);
                }
            });
        })(i++);
    }
    if (!count) {def.resolve.apply(def, out);}
    return def.promise();
};

var initializer = Deferred();
var initialized = false;

var waiting = {};
var fetches = {};
window.addEventListener('message', function(e) {
    if (e.origin === origin) return;
    console.log('include', e);
    // TODO: Put in the real Galaxy API origin.
    if (false && e.origin !== 'https://api.galaxy.mozilla.org') {
        return;
    }
    // Setup code.
    if (!initialized) {
        if (e.data === 'galaxy ready') {
            initialized = true;
            initializer.resolve();
        }
        return;
    }
    var data = e.data;
    switch(data.type) {
        case 'authenticated':
            authenticated = true;
            auth_def.resolve();
            break;
        case 'response':
            if (!(data.response in waiting)) return;
            waiting[data.response].forEach(function(cb) {
                cb(data.data);
            });
            delete waiting[data.response];
            break;
        case 'retrieved':
            if (!(data.retrieved in fetches)) return;
            fetches[data.retrieved].resolve(data.value);
            delete fetches[data.retrieved];
            break;
        case 'blob':
            gotData(data.blob, data.from);
            break;
        case 'pause':
            requestPause();
            break;
        case 'error':
            console.error('[galaxy]', data.error);
            break;
    }
});
function send(data) {
    // TODO: Make this point at the Galaxy API origin.
    initializer.done(function() {
        ifr.contentWindow.postMessage(data, '*');
    });
}

function request(opts, callback) {
    (waiting[opts.dispatch] = waiting[opts.dispatch] || []).push(callback);
    send(opts);
}

var game;
exports.configure = function(this_game) {
    if (game) return;
    game = this_game;
};

var authenticated = false;
var auth_def = Deferred();
function requireAuth(func) {
    return function() {
        if (!authenticated) {
            send({require: 'auth'});
            var self = this;
            var args = arguments;
            auth_def.done(function() {
                func.apply(self, args);
            });
            return;
        }
        return func.apply(this, arguments);
    };
}

var playing = false;
exports.playing = requireAuth(function() {
    if (playing) return;
    playing = true;
    send({type: 'playing', game: game});
});
exports.donePlaying = requireAuth(function() {
    if (!playing) return;
    playing = false;
    send({type: 'notPlaying'});
});

exports.store = function(type, value) {
    send({save: type, value: value});
};

exports.retrieve = function(type) {
    var def = fetches[type] || (fetches[type] = Deferred());
    send({retrieve: type});
    return def.promise();
};

// TODO: Throttle this method the same as on the server.
exports.updateScore = requireAuth(function(board, increment) {
    if (!playing) return;
    // Do basic validation that increment is within the right range.
    send({type: 'score', board: board, game: game, value: increment | 0 || 0});  // NaN trap.
});

exports.authenticate = function() {
    if (authenticated) {
        return Deferred().resolve().promise();
    }
    send({require: 'auth'});
    return auth_def.promise();
};

function _getFriends(only) {
    if (!authenticated) return [];

    var resp = Deferred();
    request({
        dispatch: 'friends_' + only,
        url: '/user/friends?only=' + only + '&game=' + encodeURIComponent(game),
        signed: true,
        method: 'GET'
    }, function(data) {
        if (data)
            resp.resolve(JSON.parse(data));
        else
            resp.reject();
    });
    return resp.promise();
}

exports.getFriends = function() {
    return _getFriends('played');
};

exports.getFriendsPlaying = function() {
    return _getFriends('playing');
};

// TODO: Throttle this.
exports.postFriend = function(friendID, blob) {
    // Allows posting a JSON blob to a friend who is also playing the game.
    if (typeof blob !== 'string') {
        blob = JSON.stringify(blob);
    }
    if (blob.length > 1024) {
        throw new Error('Blob too large!');
    }
    send({type: 'postBlob', recipient: friendID, value: blob});
};

function requestPause() {
    var e = document.createEvent('Event');
    e.initEvent('requestPause', true, false);
    window.dispatchEvent(e);
}

function gotData(blob, from) {
    var e = document.createEvent('Event');
    e.initEvent('gotData', true, false);
    e.value = blob;
    e.from = from;
    window.dispatchEvent(e);
}

})(navigator.game || (navigator.game = {}));
