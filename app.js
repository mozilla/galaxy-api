var settings = require('./settings_local.js');

var db = require('./db');
var server = require('./server');


[
    'game/detail',
    'game/manifest',
    'game/submit'
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

wss.on('connection', function(ws) {
    // create new redisClient.
    var clientPub = redis.createClient();
    var clientData = redis.createClient();
    var authenticated = false;
    var username = null;
    var key = null;

    ws.on('message', function(message) {
        console.log('received: %s', message);
        message = JSON.parse(message);
        console.log('auth', authenticated);
        if (!authenticated) {
            // TODO: authenticate.
            username = message.user;
            authenticated = true;
            key = 'user:' + username;
            clientPub.subscribe(key);
            return;
        }
        console.log('message', message)
        switch (message.type) {
            case 'playing':
                clientData.hset('playing', username, message.game);
                break;
            case 'playtime':
                // TODO: message.data.ms could be wrong.
                clientData.hincrby('game:' + message.game + ':playtime', username, message.data.ms);
                break;
        }
    });

    ws.on('close', function() {
        console.log('close');
        if (authenticated) {
            // TODO: check if actually subscribed.
            clientPub.unsubscribe();
            console.log('not playing');
            clientData.hdel('playing', username);
        }
        clientPub.end();
        clientData.end();
    });

    clientPub.on('message', function(channel, message) {
        if (!authenticated) {
            return;
        }
        ws.send(message);
    });

    // ws.send(JSON.stringify({data: 'open'}), function() { });
});

// TODO:
// * leaderboards
// * playtime
