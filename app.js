var settings = require('./settings_local.js');

var db = require('./db');
var server = require('./server');


[
    'game/detail',
    'game/manifest',
    'game/submit',
    'user/login'
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

var redis = require('redis');

var auth = require('./lib/auth');
var user = require('./lib/user');

wss.on('connection', function(ws) {
    // create new redisClient.
    var clientPub = redis.createClient();
    var clientData = redis.createClient();
    var authenticated = false;
    var subscribed = false;

    var user = new user.User(clientData);

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
                return;
            }
            var result = auth.verifySSA(message.token);
            if (!result) {
                ws.send(JSON.stringify({type: 'auth', error: true}));
                return;
            }
            user.authenticate(result);
            clientPub.subscribe('user:' + message.user);
            return;
        }
        console.log('message', message)
        switch (message.type) {
            case 'playing':
                user.startPlaying(message.game);
                // TODO: broadcast this to friends.
                break;
            case 'notPlaying':
                user.donePlaying();
                break;
            case 'score':
                user.updateLeaderboard(message.board, message.value);
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
