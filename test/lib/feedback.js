var _ = require('lodash');
var expect = require('chai').expect;

var settings = require('../../settings_test');
var test_db = require('../test_db');
var user = require('../../lib/user');

var feedback = require('../../lib/feedback');


describe('feedback', function() {
    var client = test_db.client(settings.REDIS_TEST_URL);

    function newTestUser(email, callback) {
        user.newUser(client, email);
        user.getUserFromEmail(client, email, function(error, user) {
            callback(user);
        });
    }

    before(function(done) {
        client.on('ready', function() {
            client.flushdb(function() {
                done();
            });
        });
    });


    describe('add', function() {
        var page_url = 'http://mozilla_galaxy/page';
        var feedback_msg = 'Nice Page';
        it('should work for anonymous users', function(done) {
            feedback.newAnonymousFeedback(client, page_url, feedback_msg, function(error, db_feedback) {
                expect(error).to.not.exist;
                expect(db_feedback).to.exist;
                expect(db_feedback.user_id).to.not.exist;
                expect(db_feedback.page_url).to.be.equal(page_url);
                expect(db_feedback.feedback).to.be.equal(feedback_msg);
                done();
            });
        });

        it('should work for registered user by email', function(done) {
            var email = 'add_feedback@test.com';
            newTestUser(email, function(test_user) {
                feedback.newFeedbackFromUserEmail(client, email, page_url, feedback_msg, function(error, db_feedback) {
                    expect(error).to.not.exist;
                    expect(db_feedback).to.exist;
                    expect(db_feedback.user_id).to.be.equal(test_user.id);
                    expect(db_feedback.page_url).to.be.equal(page_url);
                    expect(db_feedback.feedback).to.be.equal(feedback_msg);
                    done();
                });
            });
        });

        it('should not work for invalid user email', function(done) {
            var email = 'add_feedback2@test.com';
            feedback.newFeedbackFromUserEmail(client, email, page_url, feedback_msg, function(error, db_feedback) {
                expect(error).to.exist;
                expect(error).to.be.equal('bad_user');
                expect(db_feedback).to.not.exist;
                done();
            });
        });

        it('should work for registered user by id', function(done) {
            var email = 'add_feedback3@test.com';
            newTestUser(email, function(test_user) {
                feedback.newFeedback(client, test_user.id, page_url, feedback_msg, function(error, db_feedback) {
                    expect(error).to.not.exist;
                    expect(db_feedback).to.exist;
                    expect(db_feedback.user_id).to.be.equal(test_user.id);
                    expect(db_feedback.page_url).to.be.equal(page_url);
                    expect(db_feedback.feedback).to.be.equal(feedback_msg);
                    done();
                });
            });
        });

        it('should not work for invalid user id', function(done) {
            feedback.newFeedback(client, 'obviously_bad_id', page_url, feedback_msg, function(error, db_feedback) {
                expect(error).to.exist;
                expect(error).to.be.equal('bad_user');
                expect(db_feedback).to.not.exist;
                done();
            });
        });

    });

    describe('get', function() {
        var test_user;
        var feedbacks = [];

        before(function(done) {
            function newFeedback(url, feedback, userId) {
                var data =  {'page_url': url, 'feedback': feedback};
                if (userId) {
                    data.user_id = userId;
                }
                return data;
            }

            function addFeedback(i) {
                if (i >= feedbacks.length) {
                    done();
                    return;
                }
                var fb = feedbacks[i];
                if (fb.user_id) {
                    feedback.newFeedback(client, fb.user_id, fb.page_url, fb.feedback, function() {
                        addFeedback(i+1);
                    });
                } else {
                    feedback.newAnonymousFeedback(client, fb.page_url, fb.feedback, function() {
                        addFeedback(i+1);
                    });
                }
            }

            feedbacks.push(newFeedback('http://mozilla_galaxy/solo', 'solo page'));
            feedbacks.push(newFeedback('http://mozilla_galaxy/multiple', 'multiple page'));

            newTestUser('get_feedback@test.com', function(db_test_user) {
                test_user = db_test_user;
                feedbacks.push(newFeedback('http://mozilla_galaxy/multiple', 'user says multiple', db_test_user.id));
                addFeedback(0);
            })
        });

        it('should be able to get feedback', function(done) {
            feedback.getFeedbacksForPageUrl(client, 'http://mozilla_galaxy/solo', function(error, db_feedbacks) {
                expect(error).to.not.exist;
                expect(db_feedbacks).to.exist;
                expect(db_feedbacks).to.have.length(1);

                expect(db_feedbacks[0].page_url).to.be.equal('http://mozilla_galaxy/solo');
                expect(db_feedbacks[0].feedback).to.be.equal('solo page');
                done();
            });
        });

        it('should be able to get multiple feedbacks', function(done) {
            feedback.getFeedbacksForPageUrl(client, 'http://mozilla_galaxy/multiple', function(error, db_feedbacks) {
                expect(error).to.not.exist;
                expect(db_feedbacks).to.exist;
                expect(db_feedbacks).to.have.length(2);

                db_feedbacks.forEach(function(db_feedback) {
                    expect(db_feedback.page_url).to.be.equal('http://mozilla_galaxy/multiple');
                    if (db_feedback.user_id) {
                        expect(db_feedback.user_id).to.be.equal(test_user.id);
                        expect(db_feedback.feedback).to.be.equal('user says multiple');
                    } else {
                        expect(db_feedback.user_id).to.not.exist;
                        expect(db_feedback.feedback).to.be.equal('multiple page')
                    }
                });
                done();
            });
        });
    });
});
