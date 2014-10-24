var request = require('supertest');

var api = require('../..');


describe('GET /', function () {
  it('should respond with status and documentation', function (done) {
    var app = api.app;

    request(app.listen())
      .get('/')
      .expect(/ok/)
      .expect(/documentation/)
      .expect(200)
      .end(done);
  });
});
