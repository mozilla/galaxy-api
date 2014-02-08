var request = require('request');
var settings = require('../settings');
var settings_local = require('../settings_local');

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

createUsers();
createGames();