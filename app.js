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
    'user/login',
    'user/purchase'
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

    var user = new user.User(clientData);
    
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

        console.log('auth', user.authenticated);
        if (!user.authenticated) {
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
            user.authenticate(result, function(err) {
                if (err) {
                    send({type: 'error', error: err});
                } else {
                    clientPub.subscribe('user:' + user.get('id'));
                    send({type: 'authenticated', id: user.get('id')});
                    // TODO: broadcast to friends that user is online.
                }
            });
            return;
        }
        console.log('message', message)
        switch (message.type) {
            case 'playing':
                user.startPlaying(message.game, function(err) {
                    if (!err) return;
                    send({type: 'error', error: err});
                });
                // TODO: broadcast this to friends.
                break;
            case 'notPlaying':
                user.donePlaying();
                break;
            case 'score':
                user.updateLeaderboard(message.board, message.value, function(err) {
                    if (!err) return;
                    send({type: 'error', error: err});
                });
                break;
        }
    });

    ws.on('close', function() {
        console.log('close');
        intervals.forEach(function(v) {
            clearInterval(v);
        });
        if (user.authenticated && subscribed) {
            clientPub.unsubscribe();
        }
        user.finish();
        clientPub.end();
        clientData.end();
    });

    clientPub.on('message', function(channel, message) {
        if (!user.authenticated) {
            return;
        }
        ws.send(message);
    });
    clientPub.on('subscribe', function() {
        subscribed = true;
    });
});
