var settings = require('./settings_local.js');

var db = require('./db');
var serverHTTP = require('./server_http');
var serverWS = require('./server_ws');

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
    'user/search',
    'user/profile'
].forEach(function(view) {
    require('./views/' + view)(serverHTTP);
});

var serverName = serverHTTP.name;

serverHTTP.listen(process.env.PORT || 5000, function() {
    console.log('%s HTTP server listening at %s', serverName, serverHTTP.url);
});

serverWS.listen(function(url) {
    console.log('%s WebSocket server listening at %s', serverName, url);
});
