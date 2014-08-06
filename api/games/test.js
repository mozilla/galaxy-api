var request = require('supertest');

var api = require('../..');


describe('GET /games', function () {
  it('should respond with games', function (done) {
    var app = api();

    request(app.listen())
    .get('/games')
    .expect(200)
    .end(done);
  });
});


describe('POST /games/', function () {
  it('should respond with a success message', function (done) {
    var app = api();

    request(app.listen())
    .post('/games')
    .expect(200)
    .end(done);
  });
});


describe('GET /games/:slug', function () {
  it('should respond with a single game', function (done) {
    var app = api();

    request(app.listen())
    .get('/games/mario-bros')
    .expect(200)
    .end(done);
  });
});


describe('PATCH /games/:slug', function () {
  it('should respond with a success message', function (done) {
    var app = api();

    request(app.listen())
    .patch('/games/mario-bros')
    .expect(200)
    .end(done);
  });
});


describe('PUT /games/:slug', function () {
  it('should respond with a success message', function (done) {
    var app = api();

    request(app.listen())
    .put('/games/mario-bros')
    .expect(200)
    .end(done);
  });
});


describe('DELETE /games/:slug', function () {
  it('should respond with a success message', function (done) {
    var app = api();

    request(app.listen())
    .delete('/games/mario-bros')
    .expect(200)
    .end(done);
  });
});
