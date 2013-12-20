var settings = require('./settings_local.js');

var db = require('./db');
var server = require('./server');

var auth = require('./lib/auth');
var user = require('./lib/user');


[
    'game/board',
    'game/detail',
    'game/manifest',
    'game/submit',
    'user/friends',
    'user/login',
    'user/purchase',
    'user/search'
].forEach(function(view) {
    require('./views/' + view)(server);
});

server.listen(process.env.PORT || 5000, function() {
    console.log('%s listening at %s', server.name, server.url);
});

var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;

var wss = new WebSocketServer({server: server});
console.log('websocket server created');

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
