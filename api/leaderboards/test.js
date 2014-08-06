var request = require('supertest');

var api = require('../..');


describe('GET /games/:game_slug/leaderboards', function () {
  it('should respond with games', function (done) {
    var app = api();

    request(app.listen())
    .get('/games/mario-bros/leaderboards')
    .expect(200)
    .end(done);
  });
});


describe('POST /games/:game_slug/leaderboards/', function () {
  it('should respond with a success message', function (done) {
    var app = api();

    request(app.listen())
    .post('/games/mario-bros/leaderboards')
    .expect(200)
    .end(done);
  });
});


describe('POST /games/:game_slug/leaderboards/score', function () {
  it('should respond with a success message', function (done) {
    var app = api();

    request(app.listen())
    .post('/games/mario-bros/leaderboards/score')
    .expect(200)
    .end(done);
  });
});


describe('GET /games/:game_slug/leaderboards/:board_slug', function () {
  it('should respond with a single game', function (done) {
    var app = api();

    request(app.listen())
    .get('/games/mario-bros/leaderboards/warios-smashed')
    .expect(200)
    .end(done);
  });
});


describe('PATCH /games/:game_slug/leaderboards/:board_slug', function () {
  it('should respond with a success message', function (done) {
    var app = api();

    request(app.listen())
    .patch('/games/mario-bros/leaderboards/warios-smashed')
    .expect(200)
    .end(done);
  });
});


describe('PUT /games/:game_slug/leaderboards/:board_slug', function () {
  it('should respond with a success message', function (done) {
    var app = api();

    request(app.listen())
    .put('/games/mario-bros/leaderboards/warios-smashed')
    .expect(200)
    .end(done);
  });
});


describe('DELETE /games/:game_slug/leaderboards/:board_slug', function () {
  it('should respond with a success message', function (done) {
    var app = api();

    request(app.listen())
    .delete('/games/mario-bros/leaderboards/warios-smashed')
    .expect(200)
    .end(done);
  });
});
