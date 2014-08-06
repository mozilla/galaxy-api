var _ = require('lodash');
var uuid = require('node-uuid');

var user = require('./user');

function newFeedback(client, userID, pageUrl, feedback, callback) {
    var data = {id: uuid.v4(),
                send_date: new Date(),
                page_url: pageUrl,
                feedback: feedback};


    function addFeedback(feedback_data) {
        var feedback_key = 'feedback:' + pageUrl;

        var multi = client.multi();
        multi.sadd('feedbackKeys', feedback_key);
        multi.sadd(feedback_key, JSON.stringify(data));
        multi.exec(function(error, reply) {
            if (error) {
                callback('db_error');
            } else {
                callback(null, data);
            }
        });
    }

    if (!userID) {
        addFeedback(data);
    } else {
        user.getUserFromID(client, userID, function(error, user) {
            if (error) {
                callback('bad_user');
            } else {
                data.user_id = userID;
                addFeedback(data);
            }
        });
    }
}
exports.newFeedback = newFeedback;


function newFeedbackFromUserEmail(client, userEmail, pageUrl, feedback, callback) {
    user.getUserIDFromEmail(client, userEmail, function(error, userID) {
        if (error) {
            callback('bad_user');
        } else {
            newFeedback(client, userID, pageUrl, feedback, callback);
        }
    });
}
exports.newFeedbackFromUserEmail = newFeedbackFromUserEmail;


function newAnonymousFeedback(client, pageUrl, feedback, callback) {
    newFeedback(client, null, pageUrl, feedback, callback);
}
exports.newAnonymousFeedback = newAnonymousFeedback;


function getFeedbacksForPageUrl(client, pageUrl, callback) {
    var key = 'feedback:' + pageUrl;
    client.smembers(key, function(error, feedbacks) {
        if (error) {
            callback(error || 'db_error');
        } else {
            callback(null, feedbacks.map(JSON.parse));
        }
    });
}
exports.getFeedbacksForPageUrl = getFeedbacksForPageUrl;
