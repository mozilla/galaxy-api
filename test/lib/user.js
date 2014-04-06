var expect = require('chai').expect;

var settings = require('../../settings_test');
var test_db = require('../test_db');
var user = require('../../lib/user');


describe('user', function() {
    var client = test_db.client(settings.REDIS_TEST_URL);
    var test_user_email = "test@test.com";

    before(function(done) {
        client.on('ready', function() {
            client.flushdb(function() {
                done();
            });
        });
    });

    describe('add', function() {
        it('should have basic properties', function(done) {
            var test_user = user.newUser(client, test_user_email);
            expect(test_user).to.have.property('dateLastLogin');
            expect(test_user).to.have.property('email');
            expect(test_user).to.have.property('homepage');
            expect(test_user).to.have.property('id');

            expect(test_user).to.have.deep.property('permissions.developer', false);
            expect(test_user).to.have.deep.property('permissions.reviewer', false);
            expect(test_user).to.have.deep.property('permissions.admin', false);

            expect(test_user).to.have.property('support');
            expect(test_user).to.have.property('teamName');
            expect(test_user).to.have.property('teamSlug');
            expect(test_user).to.have.property('username');
            done();
        });
    });

    describe('get user', function() {
        var main_test_user;
        before(function(done) {
            main_test_user = user.newUser(client, test_user_email);
            done();
        });

        it('should work by email', function(done) {
            user.getUserFromEmail(client, test_user_email, function(error, test_user) {
                expect(error).to.be.null;
                expect(test_user).to.be.eql(main_test_user);
                done();
            });
        });

        it('should work by id', function(done) {
            user.getUserFromID(client, main_test_user.id, function(error, test_user) {
                expect(error).to.be.null;
                expect(test_user).to.be.eql(main_test_user);
                done();
            });
        });

        it('should return id from email', function(done) {
            user.getUserIDFromEmail(client, test_user_email, function(error, id) {
                expect(error).to.be.null;
                expect(id).to.be.equal(main_test_user.id);
                done();
            });
        });
    });
});
