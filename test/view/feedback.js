var expect = require('chai').expect;
var testing = require('../../lib/testing');

describe('feedback', function() {
    var app;

    before(function(done) {
        app = testing.startTestServer();
        // wait a second for the server to start
        setTimeout(done, 1000);
    });

    after(function(done) {
        app.kill('SIGINT');
        done();
    });

    describe('valid feedback', function () {
        it('should work', function(done) {
            var opts = {
                'feedback': 'This page is terrible',
                'page_url': 'http://galaxy.mozilla.org/badpage'
            };
            testing.postJSON('feedback', opts, function (error, body) {
                expect(error).to.not.exist;
                expect(body.success).to.be.equal(true);
                done();
            });
        });
    });
});
