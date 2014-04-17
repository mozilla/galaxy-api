var _ = require('lodash');

var db = require('../db');
var fblib = require('../lib/feedback');
var userlib = require('../lib/user');

module.exports = function(server) {
    // Sample usage:
    // if the optional parameter '_user' is included, the token must be valid:
    // % curl -X POST 'http://localhost:5000/feedback?_user=ssa_token' -H 'Content-Type: application/json' -H 'Accept: application/json' -d '{"page_url":"http://galaxy.mozilla.org/badpage","feedback":"This page is terrible"}'
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
            res.json(400, {error: 'bad_feedback_data'});
            return done();
        } else {
            fbData = fblib.publicFeedbackObj(fbData);
        }

        // TODO: wrap
        var email = req._email;

        if (!req._email) {
            fbData = saveFeedbackAndRespond(fbData);
            return done();
        } else {
            userlib.getUserFromEmail(client, email, function(err, result) {
                if (err || !result) {
                    res.json(500, {error: err || 'db_error'});
                    return done();
                }
                fbData.user = result.id;
                fbData = saveFeedbackAndRespond(fbData);
                return done();
            });
        }

        function saveFeedbackAndRespond(feedbackData) {
            feedbackData = fblib.newFeedback(client, feedbackData);
            res.json({success: true});
            return feedbackData;
        }
    }));
};
