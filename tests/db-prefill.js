var request = require('request');
var _ = require('lodash');

const API_ENDPOINT = 'http://localhost:5000';
const USER_COUNT = 100;

function createUsers() {
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