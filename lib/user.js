var crypto = require('crypto');

var _ = require('lodash');
var uuid = require('node-uuid');
var Promise = require('es6-promise').Promise;

var db = require('../db');
var leaderboard = require('./leaderboard');
var utils = require('./utils');


const MAX_LEADERBOARD_INCR = 10;
const TIME_UPDATE_PLAYTIME = 1000 * 60 * 5;  // 5 minutes


function newUser(client, email) {
    var userData = {
        username: email.split('@')[0],
        email: email,
        permissions: {
            developer: false,
            reviewer: false,
            admin: false
        },
        homepage: '',
        support: '',
        teamSlug: '',
        teamName: '',
        dateLastLogin: utils.now(),
        id: uuid.v4()
    };
    client.hset('users', userData.id, JSON.stringify(userData));
    client.hset('usersByEmail', email, userData.id);
    // TODO: Figure out a way to store users by username.
    return userData;
}
exports.newUser = newUser;


function updateUser(client, userID, opts, callback) {
    getUserFromID(client, userID, function(err, userData) {
        if (err) {
            callback(err);
            return;
        }

        var newUserData = _.clone(userData);

        var updateFunctions = {
            teamSlug: updateTeamSlug,
            email: updateEmail,
            username: updateUsername
        };

        Promise.all(Object.keys(opts).map(function(key) {
            var updateFunction = updateFunctions[key];
            var value = opts[key];
            if (updateFunction) {
                return updateFunction(value);
            } else {
                return updateProperty(key, value);
            }
        })).then(updateClient).catch(function(err) {
            console.error('Error updating user:', err);
            callback(err.message);
        });

        // fallback update method
        function updateProperty(key, newValue) {
            return new Promise(function(resolve, reject) {
                newUserData[key] = newValue;
                resolve(newUserData);
            });
        }
        function updateTeamSlug(newSlug) {
            return new Promise(function(resolve, reject) {
                if (userData.teamSlug !== newSlug) {
                    newUserData.teamSlug = newSlug;
                    // remove id from old teamSlug and add to new one
                    client.lrem(userData.teamSlug, 1, userData.id);
                    client.rpush(newUserData.teamSlug, newUserData.id);
                }
                resolve(newUserData);
            });
        }
        function updateEmail(newEmail) {
            return new Promise(function(resolve, reject) {
                // Email validation is handled by node-restify-validation, so we can assume
                // that if it exists, it is a well-formatted address.
                // TODO: We should probably send an email when the address changes
                var email = userData.email;
                if (newEmail && newEmail !== email) {
                    client.hexists('usersByEmail', newEmail, function(err, resp) {
                        if (err || resp) {
                            reject(err);
                            return;
                        }
                        console.log('updating email from', email, 'to', newEmail, 'for user', newUserData.id);
                        newUserData.email = newEmail;
                        client.hdel('usersByEmail', email);
                        client.hset('usersByEmail', newEmail, newUserData.id);

                        resolve(newUserData);
                    });
                } else {
                    resolve(newUserData);
                }
            });
        }
        function updateUsername(newUsername) {
            return new Promise(function(resolve, reject) { 
                // TODO: Some username validation would be nice to have (ie. profanity check)
                if (newUsername && newUsername !== newUserData.username) {
                    console.log('updating username from', newUserData.username, 'to', newUsername, 'for user', newUserData.id);
                    newUserData.username = newUsername;
                }
                resolve(newUserData);
            });
        }

        function updateClient() {
            // Only update the modified timestamp if anything but the lastLogin
            // timestamp has changed.
            if (!_.isEqual(_.omit(userData, 'dateLastLogin'),
                           _.omit(newUserData, 'dateLastLogin'))) {
                newUserData.dateLastModified = utils.now();
            }

            if (!_.isEqual(userData, newUserData)) {
                client.hset('users', newUserData.id, JSON.stringify(newUserData), function(err, reply) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, newUserData);
                    }
                });
            } else {
                callback(null, newUserData);
            }
        }
    });
}
exports.updateUser = updateUser;


// This manages user state for a single connection.
function user(dataChannel) {
    this.authenticated = false;
    this.dataChannel = dataChannel;
    this.data = {};
    this.friends = null;  // A cache.
}

user.prototype.eachFriend = function(cb) {
    if (this.friends) {
        this.friends.forEach(cb);
    } else {
        var self = this;
        this.dataChannel.smembers('friends:' + this.get('id'), function(err, resp) {
            if (err || !resp) return;
            // NOTE: This cheats. If a user adds a friend, the friend won't get
            // notifications until this user re-connects. Womp womp.
            (self.friends = resp).forEach(cb);
        });
    }
};

user.prototype.notifyFriends = function(type, data) {
    data.notification_type = type;
    data.type = 'notification';
    data.from = publicUserObj(this.get('full'));
    var json = JSON.stringify(data);
    var self = this;
    this.eachFriend(function(friendID) {
        self.dataChannel.publish('user:' + friendID, json);
    });
};

user.prototype.set = function(key, value) {
    this.data[key] = value;
};

user.prototype.get = function(key) {
    return this.data[key] || null;
};

user.prototype.authenticate = function(email, callback) {
    var self = this;
    getUserFromEmail(this.dataChannel, email, function(err, userData) {
        if (err) {
            callback('error_fetching_user');
            return;
        }
        if (!userData) {
            finishAuth(newUser(self.dataChannel, email));
        } else {
            if (userData.id === self.get('id')) {
                callback(null);
                return;
            }
            self.dataChannel.sismember('authenticated', userData.id, function(err, resp) {
                if (resp) {
                    callback('already_authenticated');
                    return;
                }
                finishAuth(userData);
            });
        }
    });

    function finishAuth(userData) {
        self.dataChannel.sadd('authenticated', userData.id);
        self.set('username', userData.username);
        self.set('id', userData.id);
        self.set('email', userData.email);
        self.set('full', userData);
        self.authenticated = true;
        callback(null);
        // After we've responded, send out notifications.
        self.notifyFriends('friend_online', {});
    }
    // TODO: There can be a race condition here. If the client doesn't
    // wait for the server to process an auth request before sending a
    // second request, their second request will be processed before
    // this callback executes. Someday, there should be a queue of
    // requests which can get processed in order when this callback
    // fires.
};

user.prototype.startPlaying = function(game, callback) {
    var self = this;
    this.dataChannel.sismember('gamesPurchased:' + this.get('id'), game, function(err, resp) {
        if (err || !resp) {
            callback('does_not_own');
            return;
        }
        self._startPlaying(game);
        callback(null);
    });
};

user.prototype._startPlaying = function(game) {
    var timeNow = utils.now();
    var currentlyPlaying = this.get('currentlyPlaying');
    if (currentlyPlaying) {
        clearInterval(this.get('playTimer'));

        var startedPlaying = this.get('startedPlaying');
        this.incrPlaytime(currentlyPlaying, timeNow - startedPlaying);
    }
    // TODO: Validate that game is valid.
    // And validate that user can play/paid for game.
    this.set('startedPlaying', timeNow);
    this.set('currentlyPlaying', game);
    this.dataChannel.hset('currentlyPlaying', this.get('id'), game);
    this.dataChannel.sadd('gamePlaying:' + game, this.get('id'));
    this.dataChannel.sadd('userPlayed:' + this.get('id'), game);
    this.dataChannel.sadd('gamePlayed:' + game, this.get('id'));
    this.notifyFriends('friend_playing', {
        game: game  // TODO: Make this use the real game name.
    });

    // Set up a timer to update this every few minutes so the data doesn't
    // get stale.
    var self = this;
    this.set('playTimer', setInterval(function() {
        self.incrPlaytime(game, TIME_UPDATE_PLAYTIME);
        self.set('startedPlaying', utils.now());
    }, TIME_UPDATE_PLAYTIME));
};

user.prototype.incrPlaytime = function(game, amount) {
    if (!amount) {
        return;
    }
    this.dataChannel.hincrby(
        'playtime:' + this.get('currentlyPlaying'),
        this.get('id'),
        amount || 0
    );
};

user.prototype.donePlaying = function() {
    var currentlyPlaying = this.get('currentlyPlaying');
    if (!currentlyPlaying) {
        return;
    }
    this.incrPlaytime(currentlyPlaying, utils.now() - this.get('startedPlaying'));
    this.dataChannel.hdel('currentlyPlaying', this.get('id'));
    this.dataChannel.srem('gamePlaying:' + currentlyPlaying, this.get('id'));

    // Clean up the playtime updater.
    clearInterval(this.get('playTimer'));

    this.set('currentlyPlaying', false);
};

user.prototype.updateLeaderboard = function(board, value, callback) {
    // TODO: Throttle this function.

    var currentlyPlaying = this.get('currentlyPlaying');
    // Check that the user is playing a game.
    if (!currentlyPlaying) {
        callback('not_playing_a_game');
        return;
    }

    // Check that the board is being updated with a valid value.
    if (typeof value !== 'number' ||
        value === 0 ||
        value < -1 * MAX_LEADERBOARD_INCR ||
        value > MAX_LEADERBOARD_INCR) {
        callback('invalid_increment');
        return;
    }

    // Check that the board the user is trying to update exists.
    var self = this;
    leaderboard.isLeaderboard(
        this.dataChannel,
        currentlyPlaying,
        board,
        function(exists) {
            if (!exists) {
                callback('invalid_board');
                return;
            }

            leaderboard.updateLeaderboard(
                self.dataChannel,
                currentlyPlaying,
                board,
                self.get('id'),
                value
            );
        }
    );
};

user.prototype.isFriendsWith = function(friend, cb) {
    // Cheaty optimization.
    if (this.friends && this.friends.indexOf(friend) !== -1) {
        cb(true);
        return;
    }
    this.dataChannel.sismember('friends:' + this.get('id'), friend, function(err, resp) {
        cb(!err && resp);
    });
};

user.prototype.finish = function() {
    if (this.authenticated) {
        this.dataChannel.srem('authenticated', this.get('id'));
        this.authenticated = false;
    }
    this.donePlaying();
};

exports.User = user;


function getUserFromID(client, id, callback) {
    /*
    `callback` is called with an error parameter and a parameter
    containing a JSON blob of user data.
    */
    client.hget('users', id, function(err, resp) {
        if (err) {
            callback('db_error');
        } else if (!resp) {
            callback('no_such_user');
        } else {
            callback(null, JSON.parse(resp));
        }
    });
}
exports.getUserFromID = getUserFromID;


function getUserFromEmail(client, email, callback) {
    getUserIDFromEmail(client, email, function(err, id) {
        if (err && err !== 'no_such_user') {
            callback(err);
        } else if (!id) {
            callback('no_such_user');
        } else {
            getUserFromID(client, id, callback);
        }
    });
}
exports.getUserFromEmail = getUserFromEmail;


function getUserIDFromEmail(client, email, callback) {
    client.hget('usersByEmail', email, function(err, resp) {
        if (err) {
            callback('db_error');
        } else if (!resp) {
            callback('no_such_user');
        } else {
            // `resp` is the user ID.
            callback(null, resp);
        }
    });
}
exports.getUserIDFromEmail = getUserIDFromEmail;

// Get all developers for a given slug
function getUserIDsFromDevSlug(client, slug, callback) {
    client.lrange(slug, 0, -1, function(err, resp) {
        if (err) {
            callback('db_error');
        } else if (!resp) {
            callback('no_users');
        } else {
            // `resp` is the list of developer IDs.
            callback(null, resp);
        }
    });
}
exports.getUserIDsFromDevSlug = getUserIDsFromDevSlug;

// Given a slug, get company info.  Look at one developer to get Company Info (they should all be the same)
function getCompanyInfoFromDevSlug(client, slug, callback) {
    getUserIDsFromDevSlug(client, slug, function(err, devs) {
        if (err && err !== 'no_users') {
            callback(err);
        } else if (!devs) {
            callback(null, null);
        } else {
            getUserFromID(client, devs[0], function(err, user) {
                if (err && err !== 'no_such_user') {
                    callback(err);
                } else if (err === 'no_such_user') {
                    callback('no users with dev slug');
                } else {
                    // the response will be company info
                    callback(null, publicDevObj(user));
                }
            })
        }
    });
}
exports.getCompanyInfoFromDevSlug = getCompanyInfoFromDevSlug;


function getGravatarURL(email) {
    return 'http://www.gravatar.com/avatar/' + crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
}
exports.getGravatarURL = getGravatarURL;


function publicUserObj(full) {
    return {
        avatar: getGravatarURL(full.email),
        username: full.username,
        id: full.id
    };
}
exports.publicUserObj = publicUserObj;


function publicDevObj(full) {
    return {
        // TODO: Company images
        avatar: getGravatarURL(full.email),
        companyName: full.companyName,
        homepage: full.homepage,
        support: full.support
    }
}
exports.publicDevObj = publicDevObj;


function getPublicUserObj(client, id, callback) {
    // `callback` is called with a single parameter, which is either
    // the public user object or `null`.
    client.hget('users', id, function(err, resp) {
        if (err || !resp) {
            callback(null);
            return;
        }
        try {
            callback(publicUserObj(JSON.parse(resp)));
        } catch(e) {
            callback(null);
        }
    });
}
exports.getPublicUserObj = getPublicUserObj;


function getPublicUserObjList(client, ids, callback) {
    // `callback` is called with a single parameter, which is an
    // array of public user objects. If any result is invalid, it
    // is not included.
    if (!ids.length) {
        callback([]);
        return;
    }
    client.hmget(['users'].concat(ids), function(err, resp) {
        if (err || !resp) {
            callback(null);
            return;
        }
        callback(resp.map(function(full) {
            if (!full) return;
            try {
                return publicUserObj(JSON.parse(full));
            } catch(e) {
                return;
            }
        }).filter(function(x) {return x;}));
    });
}
exports.getPublicUserObjList = getPublicUserObjList;

function _newUserView(view, fetchMethod) {
    return db.redisView(function(client, done, req, res, wrap) {
        var args = Array.prototype.slice.call(arguments, 0);
        var email = req._email;
        if (!email) {
            res.json(403, {error: 'missing_user'});
            done();
            return;
        }

        fetchMethod(client, email, function(err, result) {
            if (err || !result) {
                res.json(500, {error: err || 'db_error'});
                done();
                return;
            }
            view.apply(this, [result].concat(args));
        });
    });
}

/*
 These methods expose view wrappers that will pre-fetch and validate
 the user ID or user data based on the `_user` parameter in the request.
 These wrappers are themselves wrappers of `db.redisView`. Upon success,
 the view is then called with the result prepended to the argument list
 provided by `db.redisView`. They can be used like so:

 server.post(
     '/foo/bar',
     userIDView(function(id, client, done, req, res, wrap) {
        // do something with id...
     })
 );
 */
function userIDView(view) {
    return _newUserView(view, getUserIDFromEmail);
}
exports.userIDView = userIDView;

function userDataView(view) {
    return _newUserView(view, getUserFromEmail);
}
exports.userDataView = userDataView;
