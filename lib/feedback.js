var _ = require('lodash');
var uuid = require('node-uuid');

function newFeedback(client, data) {
    data.id = uuid.v4();
    data.send_date = new Date();

    client.hset('feedback', data.id, JSON.stringify(data));

    return data;
}
exports.newFeedback = newFeedback;


function publicFeedbackObj(full) {
    return _.pick(full, [
        'page_url',
        'feedback'
    ]);
}
exports.publicFeedbackObj = publicFeedbackObj;
