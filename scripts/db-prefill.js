var request = require('request');
var settings = require('../settings');
var settings_local = require('../settings_local');
var _ = require('lodash');
var Promise = require('es6-promise').Promise;

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
        var email = emailAssertion.email;
        var assertion = emailAssertion.assertion;

        return new Promise(function(resolve,reject){
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

                resolve({email:email, token:json_resp.token});
            });
        });
    };

    var promises = [];
    for (var i = 0; i < USER_COUNT; i++){
        promises.push(createUser('test' + i + '@test.com').then(login));
    }
    return Promise.all(promises);
}

function createGames() {
    // do stuff
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
        }));
    });
    return Promise.all(promises);
}

createUsers().then(function(result){
    console.log('user creation done!');
}, function(err) {
    console.log('user creation error', err);
});

createGames().then(function(result){
    console.log('game creation done! result:', result);
}, function(err) {
    console.log('game creation error:', err);
});