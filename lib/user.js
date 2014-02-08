var crypto = require('crypto');

var _ = require('lodash');
var uuid = require('node-uuid');

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
        companySlug: '',
        companyName: '',
        dateLastLogin: utils.now(),
        id: uuid.v4()
    };
    client.hset('users', userData.id, JSON.stringify(userData));
    client.hset('usersByEmail', email, userData.id);
    // TODO: Figure out a way to store users by username.
    return userData;
}
exports.newUser = newUser;


function updateUser(client, userData, opts) {
    var newUserData = _.extend(_.clone(userData), opts);
    // Only update the modified timestamp if anything but the lastLogin
    // timestamp has changed.
    if (!_.isEqual(_.omit(userData, 'dateLastLogin'),
                   _.omit(newUserData, 'dateLastLogin'))) {
        newUserData.datelastModified = utils.now();
    }
    client.hset('users', newUserData.id, JSON.stringify(newUserData));
    if (userData.email !== newUserData.email) {
        client.hset('usersByEmail', newUserData.email, newUserData.id);
    }
    return newUserData;
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
            callback(null, null);
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
