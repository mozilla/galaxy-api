var _ = require('lodash');

var db = require('../db');
var fblib = require('../lib/feedback');
var userlib = require('../lib/user');

module.exports = function(server) {
    // Sample usage:
    // if the optional parameter '_user' is included, the token must be valid:
    // % curl -X POST 'http://localhost:5000/feedback?_user=ssa_token' -H 'Content-Type: application/json' -H 'Accept: application/json' -d '{"page_url":"http://galaxy.mozilla.org/badpage","feedback":"This page is terrible","sprout": "potato", "tuber":""}'
    server.post({
        url: '/feedback',
        swagger: {
            nickname: 'feedback',
            notes: 'Submit feedback',
            summary: 'Submit feedback for a site page'
        },
        validation: {
            feedback: { isRequired: true },
            page_url: { isRequired: true }
        }
    }, db.redisView(function(client, done, req, res, wrap) {
        // We only allow the publicly accessible fields to be POST/PUT.

        var fbData = req.params;
        // potato-captcha validation: tuber's value should always be blank, and sprout's value should always be potato (set by HTML)
        if (fbData.tuber || fbData.sprout !== 'potato') {
            res.json(403, {error: 'bad_feedback_data'});
            return done();
        }

        function feedbackCallback(error, result) {
            if (error) {
                res.json(500, {error: 'db_error'});
            } else {
                res.json({success: true});
            }
            done();
        }

        var email = req._email;
        if (email) {
            fblib.newFeedbackFromUserEmail(client, email, fbData.page_url, fbData.feedback, feedbackCallback);
        } else {
            fblib.newAnonymousFeedback(client, fbData.page_url, fbData.feedback, feedbackCallback);
        }
    }));
};
