var serverHTTP = require('./server_http');

var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;

var db = require('./db');
var auth = require('./lib/auth');
var user = require('./lib/user');

module.exports.listen = function(cb) {
    var host = serverHTTP.url.replace(/^http/, 'ws');  // http:// -> ws://, https:// -> wss://
    var wss = new WebSocketServer({server: serverHTTP});

    wss.on('connection', function(ws) {
        // create new redisClient.
        var clientPub = db.redis();
        var clientData = db.redis();
        var authenticated = false;
        var subscribed = false;

        var user_ = new user.User(clientData);

        function send(data) {
            return ws.send(JSON.stringify(data));
        }

        ws.on('message', function(message) {
            console.log('received: %s', message);

            try {
                message = JSON.parse(message);
            } catch (e) {
                // Ignore bad JSON bits.
                return;
            }

            console.log('auth', user_.authenticated);
            if (!user_.authenticated) {
                if (message.type !== 'auth') {
                    // Ignore non-auth requests from the client until
                    // authentication has taken place.
                    send({type: 'error', error: 'not_authenticated'});
                    return;
                }
                var result = auth.verifySSA(message.token);
                if (!result) {
                    send({type: 'error', error: 'bad_token'});
                    return;
                }
                user_.authenticate(result, function(err) {
                    if (err) {
                        send({type: 'error', error: err});
                    } else {
                        clientPub.subscribe('user:' + user_.get('id'));
                        send({type: 'authenticated', id: user_.get('id')});
                        // TODO: broadcast to friends that user is online.
                    }
                });
                return;
            }
            console.log('message', message)
            switch (message.type) {
                case 'playing':
                    user_.startPlaying(message.game, function(err) {
                        if (!err) return;
                        send({type: 'error', error: err});
                    });
                    // TODO: broadcast this to friends.
                    break;
                case 'notPlaying':
                    user_.donePlaying();
                    break;
                case 'score':
                    user_.updateLeaderboard(message.board, message.value, function(err) {
                        if (!err) return;
                        send({type: 'error', error: err});
                    });
                    break;
                case 'postBlob':
                    // TODO: Throttle this.
                    if (typeof message.value !== 'string' || message.value > 1024) {
                        send({type: 'error', error: 'invalid_blob'});
                        return;
                    } else if (!user_.get('currentlyPlaying')) {
                        send({type: 'error', error: 'not_playing_a_game'});
                        return;
                    }
                    var blob;
                    try {
                        blob = JSON.parse(message.value);
                    } catch(e) {
                        send({type: 'error', error: 'invalid_blob'});
                        return;
                    }
                    user_.isFriendsWith(message.recipient, function(resp) {
                        if (!resp) {
                            send({type: 'error', error: 'not_friends'});
                            return;
                        }
                        clientData.sismember('gamePlaying:' + user_.get('currentlyPlaying'), message.recipient, function(err, resp) {
                            if (err || !resp) {
                                send({type: 'error', error: 'friend_not_playing'});
                                return;
                            }
                            clientData.publish(
                                'user:' + message.recipient,
                                JSON.stringify({
                                    type: 'blob',
                                    blob: blob,
                                    from: user_.get('id')
                                })
                            );
                        });
                    });
                    break;
            }
        });

        ws.on('close', function() {
            console.log('close');
            if (user_.authenticated && subscribed) {
                clientPub.unsubscribe();
            }
            user_.finish();
            clientPub.end();
            clientData.end();
        });

        clientPub.on('message', function(channel, message) {
            if (!user_.authenticated) {
                return;
            }
            ws.send(message);
        });
        clientPub.on('subscribe', function() {
            subscribed = true;
        });
    });

    return cb(host);
};
