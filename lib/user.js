var uuid = require('uuid');

var leaderboard = require('./leaderboard');


const MAX_LEADERBOARD_INCR = 10;
const TIME_UPDATE_PLAYTIME = 1000 * 60 * 5;  // 5 minutes


function now() {
    // Returns a UNIX timestamp.
    return Math.floor((new Date()).getTime() / 1000);
}

// This manages user state for a single connection.
function user(dataChannel) {
    this.authenticated = false;
    this.dataChannel = dataChannel;
    this.data = {};
}

user.prototype.set = function(key, value) {
    this.data[key] = value;
};

user.prototype.get = function(key) {
    return this.data[key] || null;
};

user.prototype.authenticate = function(email, callback) {
    var self = this;
    this.dataChannel.hget('users', email, function(err, userData) {
        if (err) {
            callback('error_fetching_user');
            return;
        }
        if (!userData) {
            userData = {
                username: email.split('@')[0],
                email: email,
                id: uuid.v4()
            };
            self.dataChannel.hset('users', email, JSON.stringify(userData));
            finishAuth(userData);
        } else {
            userData = JSON.parse(userData);
            self.dataChannel.hget('authenticated', userData.id, function(err, resp) {
                if (resp) {
                    callback('already_authenticated');
                    return;
                }
                finishAuth(userData);
            });
        }
    });
    
    function finishAuth(userData) {
        self.dataChannel.hset('authenticated', userData.id, 'y');
        self.set('username', userData.username);
        self.set('uid', userData.id);
        self.set('email', userData.email);
        self.authenticated = true;
        callback(null);
    }
    // TODO: There can be a race condition here. If the client doesn't
    // wait for the server to process an auth request before sending a
    // second request, their second request will be processed before
    // this callback executes. Someday, there should be a queue of
    // requests which can get processed in order when this callback
    // fires.
};

user.prototype.startPlaying = function(game) {
    var timeNow = now();
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
    this.dataChannel.sadd('userPlayed:' + this.get('id'), game);
    this.dataChannel.sadd('gamePlayed:' + game, this.get('id'));

    // Set up a timer to update this every few minutes so the data doesn't
    // get stale.
    var self = this;
    this.set('playTimer', setInterval(function() {
        self.incrPlaytime(game, TIME_UPDATE_PLAYTIME);
        self.set('startedPlaying', now());
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
        return
    }
    this.incrPlaytime(currentlyPlaying, now() - this.get('startedPlaying'));
    this.dataChannel.hdel('currentlyPlaying', this.get('id'));

    // Clean up the playtime updater.
    clearInterval(this.get('playTimer'));
};

user.prototype.updateLeaderboard = function(board, value) {
    // TODO: Throttle this function.

    var currentlyPlaying = this.get('currentlyPlaying');
    // Check that the user is playing a game.
    if (!currentlyPlaying) {
        return;
    }

    // Check that the board is being updated with a valid value.
    if (typeof value !== 'number' ||
        value === 0 ||
        value < -1 * MAX_LEADERBOARD_INCR ||
        value > MAX_LEADERBOARD_INCR) {
        return;
    }

    // Check that the board the user is trying to update exists.
    leaderboard.isLeaderboard(
        this.dataChannel,
        currentlyPlaying,
        board,
        function(exists) {
            if (!exists) return;

            leaderboard.updateLeaderboard(
                this.dataChannel,
                currentlyPlaying,
                board,
                this.get('id'),
                value
            );
        }
    );
};

user.prototype.finish = function() {
    if (this.authenticated) {
        this.dataChannel.hdel('authenticated', this.get('id'));
        this.authenticated = false;
    }
    this.donePlaying();
};

exports.User = user;
