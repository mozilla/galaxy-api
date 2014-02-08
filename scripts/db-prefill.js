var request = require('request');
var _ = require('lodash');
var Promise = require('es6-promise').Promise;

var settings = require('../settings');
var settings_local = require('../settings_local');
var utils = require('../lib/utils');

const API_ENDPOINT = 'http://localhost:5000';
const PERSONA_ENDPOINT = 'http://localhost:9001';
const USER_COUNT = 100;

function createUsers() {
    function createUser(email) {
        return new Promise(function(resolve,reject){
            request.post({
                url: PERSONA_ENDPOINT+'/generate',
                form: {
                    email: email
                }
            }, function(err, resp, body) {
                if (err) {
                    reject('Connection to assertion generator failed');
                    return;
                }
                
                var json_resp = JSON.parse(body);
                resolve({email:email, assertion:json_resp.assertion});
            });
        });
    };

    function login(emailAssertion){
        return new Promise(function(resolve,reject){
            var email = emailAssertion.email;
            var assertion = emailAssertion.assertion;
            request.post({
                url: API_ENDPOINT+'/user/login',
                form: {
                    assertion: assertion,
                    audience: API_ENDPOINT
                }
            }, function(err, resp, body) {
                if (err) {
                    reject('Galaxy login failed.');
                    return;
                }
                
                var json_resp = JSON.parse(body);
                if (json_resp.error) {
                    reject('Galaxy login failed: ' + json_resp.error);
                    return;
                }
                resolve({
                    email:email,
                    token:json_resp.token,
                    username:json_resp.public.username,
                    id:json_resp.public.id
                });
            });
        });
    };

    var promises = [];
    for (var i = 0; i < USER_COUNT; i++){
        promises.push(createUser('test' + i + '@test.com').then(login));
    }
    return Promise.all(promises);
}

function createFriends(users) {
    function sendRequests(user) {
        var recipients = _.sample(users, Math.min(3,USER_COUNT));
        var promises = [];
        _.each(recipients, function(recipient){
            promises.push(sendRequest(user, recipient));
        });
        return Promise.all(promises);
    }

    function sendRequest(user, recipient) {
        return new Promise(function(resolve,reject){
            request.post({
                url: API_ENDPOINT+'/user/friends/request',
                form: {
                    _user: user.token,
                    recipient: recipient.id
                }
            }, function(err, resp, body) {
                if (err) {
                    reject(err);
                    return;
                }
                
                var json_resp = JSON.parse(body);
                if (json_resp.error) {
                    if (json_resp.error === 'already_friends') {
                        console.log("Friend request failed:", json_resp.error);
                        resolve({});
                    } if (json_resp.error === 'already_requested') {
                        console.log("Friend request failed:", json_resp.error);
                        resolve({});
                    } else {
                        reject(json_resp.error);
                    }
                    return;
                }
                
                resolve({
                    user: user,
                    recipient: recipient
                });
            });
        });
    }

    function acceptRequest(request) {
        if (!(request.user && request.recipient))
            // silently ignore acceptable errors
            return;
        return new Promise(function(resolve,reject){
            request.post({
                url: API_ENDPOINT+'/user/friends/accept',
                form: {
                    _user: request.recipient.token,
                    acceptee: request.user.id
                }
            }, function(err, resp, body) {
                if (err) {
                    reject(err);
                    return;
                }
                
                var json_resp = JSON.parse(body);
                if (json_resp.error) {
                    reject("Friend accept failed: " + json_resp.error)
                    return;
                }
                resolve({
                    user: request.user,
                    recipient: request.recipient
                });
            });
        });
    }

    var promises = [];
    _.each(users, function(user){
        promises.push(sendRequests(user).then(acceptRequest));
    });
    return Promise.all(promises)
}

function createGames() {
    var default_params = {
        icons: '128',
        screenshots: 'yes'
    };
    var fake_games = [
        {
            name: 'Mario Broskis',
            app_url: 'http://mario.broskis'
        }, 
        {
            name: 'Halo 718',
            app_url: 'http://halo.com'
        },
        {
            name: 'Left 5 Dead',
            app_url: 'http://dead.left'
        }
    ];

    var promises = [];
    _.each(fake_games, function(game) {
        promises.push(new Promise(function(resolve, reject) {
            request.post({
                url: API_ENDPOINT + '/game/submit',
                form: _.defaults(game, default_params)
            }, function(err, resp, body) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(body);
            });
        }).then(JSON.parse));
    });
    return Promise.all(promises);
}

function purchaseGames(userSSAs, gameSlugs) {
    var promises = [];
    _.each(userSSAs, function(user){
        _.each(_.sample(gameSlugs, 2), function(game) {
            promises.push(newPurchase(user, game));
        });
    });

    function newPurchase(user, game) {
        return new Promise(function(resolve, reject) {
            request.post({
                url: API_ENDPOINT + '/user/purchase',
                form: {
                    _user: user,
                    game: game
                }
            }, function(err, resp, body) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(body);
            });
        });
    }

    return promises;
}

utils.promiseMap({
    users: createUsers(), 
    games: createGames()
}).then(function(result){
    var gameSlugs = result.games.map(function(json) { return json.slug; });
    var userSSAs = result.users.map(function(user) { return user.token; });
    // TODO: This promise should probably not be here
    createFriends(result.users).then(function(result){console.log('done creating friends', result)})
    return purchaseGames(userSSAs, gameSlugs);
}).then(function(result) {
    console.log('purchased games:', result);
}).catch(function(err) {
    console.log('error:', err.stack);
});