var request = require('request');
var settings = require('../settings');
var settings_local = require('../settings_local');
var _ = require('lodash');

const API_ENDPOINT = 'http://localhost:5000';
const PERSONA_ENDPOINT = 'http://localhost:9001';
const USER_COUNT = 100;

function createUsers() {
    var SSATokens = [];

    function createUser(email){
        var req = request.post({
            url: PERSONA_ENDPOINT+'/generate',
            form: {
                email: email
            }
        }, function(err, resp, body) {
            if (err) {
                console.log('Connection to assertion generator failed.', null);
                return;
            }
            
            var json_resp = JSON.parse(body);
            login(email, json_resp.assertion);
        });
    };

    function login(email, assertion){
        var req = request.post({
            url: API_ENDPOINT+'/user/login',
            form: {
                assertion: assertion,
                audience: API_ENDPOINT
            }
        }, function(err, resp, body) {
            if (err) {
                console.log('Galaxy login failed.', null);
                return;
            }
            
            var json_resp = JSON.parse(body);
            if (json_resp.error) {
                console.log('Galaxy login failed:', json_resp.error);
                return;
            }

            SSATokens[email] = json_resp.token;
            console.log(json_resp)
        });
    };

    for (var i = 0; i < USER_COUNT; i++){
        createUser('test' + i + '@test.com')
    }
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

    _.each(fake_games, function(game) {
        request.post({
            url: API_ENDPOINT + '/game/submit',
            form: _.defaults(game, default_params)
        }, function(err, resp, body) {
            if (err) {
                throw new Error(err);
                return;
            }

            console.log('game! body:', body);
        });
    });
}

createUsers();
createGames();
