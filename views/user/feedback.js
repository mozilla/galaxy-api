var _ = require('lodash');

var db = require('../../db');
var gamelib = require('../../lib/game');
var userlib = require('../../lib/user');
var utils = require('../../lib/utils');

// TODO: remove this if/after moving the next two functions to lib
var uuid = require('node-uuid');

// TODO: move these next two functions to ../../lib?
function publicFeedbackObj(full) {
    return _.pick(full, [
        'user',
        'page_url',
        'message'
    ]);
}

function newFeedback(client, data) {
    data.id = uuid.v4();
    data.send_date = new Date();

    client.hset('feedback', data.id, JSON.stringify(data));

    return data;
}

function validateFeedback(fbData, requiredKeys) {
    var requiredKeysExists = true;
    requiredKeys.forEach(function(key) {
        if (!(key in fbData) || !fbData[key]|| _.isEmpty(fbData[key])) {
            requiredKeysExists = false;
        }
    });

    if (!requiredKeysExists) {
        return null;
    }

    // TODO: Validate page_url

    // We only allow the publicly accessible fields to be POST/PUT.
    return publicFeedbackObj(fbData);
}

module.exports = function(server) {
    // Sample usage:
    // % curl -X POST 'http://localhost:5000/user/feedback?_user=ssa_token' -H 'Content-Type: application/json' -H 'Accept: application/json' -d '{"page_url":"http://galaxy.mozilla.com/badpage","message":"This page is terrible"}'
    server.post({
        url: '/user/feedback',
        swagger: {
            nickname: 'feedback',
            notes: 'Submit feedback',
            summary: 'Submit feedback for a site page'
        },
    }, userlib.userDataView(function(user, client, done, req, res) {
        // TODO: being logged in should be optional
        var fbData = req.body;
        if (typeof fbData != 'object') {
            res.json(400, {error: 'bad_json_request'});
            return done();
        }

        // TODO: use potato-captcha to verify real feedback
        var requiredKeys = ['page_url', 'message'];
        fbData = validateFeedback(fbData, requiredKeys);
        if (!fbData) {
            res.json(400, {error: 'bad_feedback_data'});
            return done();
        }

        newFeedback(client, fbData);
        res.json(fbData);
    }));
};
