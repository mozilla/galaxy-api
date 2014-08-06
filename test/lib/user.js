var _ = require('lodash');
var expect = require('chai').expect;

var settings = require('../../settings_test');
var test_db = require('../test_db');
var user = require('../../lib/user');

const TEST_USER_EMAILS = ['test@test.com', 'test2@test.com', 'test3@test.com'];


describe('user', function() {
    var client = test_db.client(settings.REDIS_TEST_URL);

    before(function(done) {
        client.on('ready', function() {
            client.flushdb(function() {
                done();
            });
        });
    });

    describe('add', function() {
        it('should have basic properties', function(done) {
            var test_user = user.newUser(client, TEST_USER_EMAILS[0]);
            expect(test_user).to.have.property('dateLastLogin');
            expect(test_user).to.have.property('email');
            expect(test_user).to.have.property('id');

            expect(test_user).to.have.deep.property('permissions.developer', false);
            expect(test_user).to.have.deep.property('permissions.reviewer', false);
            expect(test_user).to.have.deep.property('permissions.admin', false);

            expect(test_user).to.have.property('username');
            done();
        });
    });

    describe('get', function() {
        var test_user;
        before(function(done) {
            test_user = user.newUser(client, TEST_USER_EMAILS[0]);
            done();
        });

        it('should work by email', function(done) {
            user.getUserFromEmail(client, TEST_USER_EMAILS[0], function(error, db_user) {
                expect(error).to.not.exist;
                expect(db_user).to.exist;
                expect(db_user).to.be.eql(test_user);
                done();
            });
        });

        it('should work by id', function(done) {
            user.getUserFromID(client, test_user.id, function(error, db_user) {
                expect(error).to.not.exist;
                expect(db_user).to.exist;
                expect(db_user).to.be.eql(test_user);
                done();
            });
        });

        it('should return id from email', function(done) {
            user.getUserIDFromEmail(client, TEST_USER_EMAILS[0], function(error, id) {
                expect(error).to.not.exist;
                expect(id).to.be.equal(test_user.id);
                done();
            });
        });
    });

    describe('update', function() {
        function testUpdateSuccess(client, test_user, patch, done) {
            var updated_user = _.assign(_.cloneDeep(test_user), patch);

            user.updateUser(client, test_user.id, patch, function(error, db_user) {
                expect(error).to.not.exist;
                expect(db_user).to.exist;
                expect(db_user).to.have.property('dateLastModified');
                expect(_.omit(db_user, 'dateLastModified')).to.be.eql(updated_user);

                // Retrieve it again just to make sure that it works
                user.getUserFromEmail(client, updated_user.email, function(error, db_user) {
                    expect(error).to.not.exist;
                    expect(_.omit(db_user, 'dateLastModified')).to.be.eql(updated_user);
                    done();
                });
            });
        }

        var test_user;
        beforeEach(function(done) {
            client.flushdb(function() {
                user.newUser(client, TEST_USER_EMAILS[0]);
                user.getUserFromEmail(client, TEST_USER_EMAILS[0], function(error, db_user) {
                    test_user = db_user;
                    done();
                });
            });
        });

        describe('basic properties', function() {
            it('should work', function(done) {
                var patch = {homepage: 'http://www.newhomepage.com/'};
                testUpdateSuccess(client, test_user, patch, done);
            });
        });

        describe('indexable properties', function() {
            it('should work for email', function(done) {
                var patch = {email: 'new_test@test.com'};
                testUpdateSuccess(client, test_user, patch, function() {
                    // We should no longer have any user with the old email
                    user.getUserFromEmail(client, test_user.email, function(error, db_user) {
                        expect(error).to.be.equal('no_such_user');
                        expect(db_user).to.not.exist;
                        done();
                    });
                });
            });

            it.skip('should not work for id', function(done) {
                var patch = {id: 'booya modified id woots'};
                user.updateUser(client, test_user.id, patch, function(error, test_user) {
                    expect(error).to.exist;
                    expect(test_user).to.not.have.property('dateLastModified');
                    expect(test_user).to.be.eql(test_user);
                    done();
                });
            });
        });

        describe('permissions properties', function() {
            it('should work', function(done) {
                var permissions = test_user.permissions;
                permissions.admin = true;
                var patch = {permissions: permissions};
                testUpdateSuccess(client, test_user, patch, done);
            });
        });

        describe('team properties', function() {
            it('should work for team slug', function(done) {
                var patch = {teamSlug: 'my_team'};
                testUpdateSuccess(client, test_user, patch, done);
            });
        })
    });

    describe('masked', function() {
        var test_users = [];
        before(function(done) {
            test_users = TEST_USER_EMAILS.map(function(email) {
                return user.newUser(client, email);
            });
            done();
        });

        it('should work for publicUserObj', function(done) {
            var public_user = user.publicUserObj(test_users[0]);
            var public_keys = ['avatar', 'username', 'id'];
            var user_keys = Object.keys(public_user);

            expect(public_keys.sort()).to.be.eql(user_keys.sort());
            done();
        });

        it('should work for publicDevObj', function(done) {
            var dev_user = user.publicDevObj(test_users[0]);
            var public_keys = ['avatar', 'companyName', 'homepage', 'support'];
            var user_keys = Object.keys(dev_user);

            expect(public_keys.sort()).to.be.eql(user_keys.sort());
            done();
        });

        it.skip('should work for publicUserObj with null input', function(done) {
            var public_user = user.publicUserObj(null);
            expect(public_user).to.not.exist;
            done();
        });

        it.skip('should work for publicDevObj with null input', function(done) {
            var dev_user = user.publicDevObj(null);
            expect(public_user).to.not.exist;
            done();
        });

        it.skip('should work for getPublicUserObj', function(done) {
            var test_user = test_users[0];
            var public_user = user.publicUserObj(test_user);
            user.getPublicUserObj(client, test_user.id, function(error, db_user) {
                expect(error).to.not.exist;
                expect(db_user).to.be.eql(public_user);
                done();
            });
        });

        it.skip('should work for getPublicUserObjList', function(done) {
            var ids = [];
            var public_users = [];

            test_users.forEach(function(test_user) {
                ids.push(test_user.id);
                public_users.push(user.publicUserObj(test_user));
            });

            user.getPublicUserObjList(client, ids, function(error, db_users) {
                expect(error).to.not.exist;
                expect(db_users).to.be.eql(public_users);
                done();
            });
        });

        it('should work for empty null user in getPublicUserObj', function(done) {
            user.getPublicUserObj(client, undefined, function(error, db_user) {
                expect(error).to.not.exist;
                expect(db_user).to.not.exist;
                done();
            });
        });

        it('should work for empty users in getPublicUserObjList', function(done) {
            user.getPublicUserObj(client, [], function(error, db_users) {
                expect(error).to.not.exist;
                expect(db_users).to.not.exist;
                done();
            });
        });

        it('should work for null users in getPublicUserObjList', function(done) {
            user.getPublicUserObj(client, undefined, function(error, db_users) {
                expect(error).to.not.exist;
                expect(db_users).to.not.exist;
                done();
            });
        });
    });
    
    describe('team slug', function() {
        var test_devs = [];
        var updated_devs = [];
        before(function(done) {
            var patches = [{permissions: {developer: true}, teamSlug: 'team_a', companyName: 'Team A'}, 
                           {permissions: {developer: true}, teamSlug: 'team_a', companyName: 'Team A'},
                           {permissions: {developer: true}, teamSlug: 'team_b', companyName: 'Team B'}];

            test_devs.push(user.newUser(client, TEST_USER_EMAILS[0]));
            test_devs.push(user.newUser(client, TEST_USER_EMAILS[1]));
            test_devs.push(user.newUser(client, TEST_USER_EMAILS[2]));

            (function updateDevelopers(i) {
                if (i >= test_devs.length) {
                    return done();
                }

                user.getUserFromEmail(client, TEST_USER_EMAILS[i], function(error, dev_user) {
                    user.updateUser(client, dev_user.id, patches[i], function(error, dev) {
                        updated_devs.push(dev);
                        updateDevelopers(i+1);
                    });
                });
            })(0);
        });

        describe('get dev ids from team slug', function() {
            it('should work for valid teams', function(done) {
                user.getUserIDsFromDevSlug(client, 'team_a', function(error, db_dev_ids) {
                    expect(error).to.not.exist;
                    expect(db_dev_ids).to.exist;
                    expect(db_dev_ids).to.have.length(2);
                    expect(db_dev_ids).to.include(updated_devs[0].id);
                    expect(db_dev_ids).to.include(updated_devs[1].id);

                    user.getUserIDsFromDevSlug(client, 'team_b', function(error, db_dev_ids) {
                        expect(error).to.not.exist;
                        expect(db_dev_ids).to.exist;
                        expect(db_dev_ids).to.have.length(1);
                        expect(db_dev_ids).to.include(updated_devs[2].id);
                        done();
                    });
                });
            });

            it('should work for invalid teams', function(done) {
                user.getUserIDsFromDevSlug(client, 'team_z', function(error, db_dev_ids) {
                    expect(error).to.not.exist;
                    expect(db_dev_ids).to.exist;
                    expect(db_dev_ids).to.have.length(0);
                    done();
                });
            });
        });

        describe('get team info from team slug', function() {
            it('should work for valid teams', function(done) {
                user.getCompanyInfoFromDevSlug(client, 'team_a', function(error, db_team_info) {
                    expect(error).to.not.exist;
                    expect(db_team_info).to.exist;
                    expect(db_team_info.companyName).to.be.equal('Team A');

                    user.getCompanyInfoFromDevSlug(client, 'team_b', function(error, db_team_info) {
                        expect(error).to.not.exist;
                        expect(db_team_info).to.exist;
                        expect(db_team_info.companyName).to.be.equal('Team B');
                        done();
                    });
                });
            });

            it.skip('should work for invalid teams', function(done) {
                user.getCompanyInfoFromDevSlug(client, 'team_z', function(error, db_team_info) {
                    expect(error).to.not.exist;
                    expect(db_team_info).to.not.exist;
                    done();
                });
            });
        });
    });

    // TODO: Authentication functions (#178)

    // TODO: user object methods functions (#178)
});
