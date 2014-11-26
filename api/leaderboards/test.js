var request = require('supertest');

var api = require('../..');


describe('Leaderboards', function() {

  before(function() {
    // Flush the database then create some data to use in tests.
    api.app.redis.flushdb();
    api.app.redis.hset(
      'game',
      'le-game',
      '{"slug": "le-game", "name": "Le Game", "game_url": "http://le.ga.me", "desription": "What a cool game it is!"}'
    );
  });


  after(function(){
    // Flush the database for following tests.
    api.app.redis.flushdb();
  });


  describe('GET /games/:game_slug/leaderboards', function () {
    it('should respond with games', function (done) {
      request(api.app.listen())
        .get('/games/mario-bros/leaderboards')
        .expect(200)
        .end(done);
    });
  });


  describe('POST /games/:game_slug/leaderboards/', function () {
    it('should respond with a success message', function (done) {
      request(api.app.listen())
        .post('/games/mario-bros/leaderboards')
        .expect(200)
        .end(done);
    });
  });


  describe('POST /games/:game_slug/leaderboards/score', function () {
    it('should respond with a success message', function (done) {
      request(api.app.listen())
        .post('/games/mario-bros/leaderboards/score')
        .expect(200)
        .end(done);
    });
  });


  describe('GET /games/:game_slug/leaderboards/:board_slug', function () {
    it('should respond with a single game', function (done) {
      request(api.app.listen())
        .get('/games/mario-bros/leaderboards/warios-smashed')
        .expect(200)
        .end(done);
    });
  });


  describe('PATCH /games/:game_slug/leaderboards/:board_slug', function () {
    it('should respond with a success message', function (done) {
      request(api.app.listen())
        .patch('/games/mario-bros/leaderboards/warios-smashed')
        .expect(200)
        .end(done);
    });
  });


  describe('PUT /games/:game_slug/leaderboards/:board_slug', function () {
    it('should respond with a success message', function (done) {
      request(api.app.listen())
        .put('/games/mario-bros/leaderboards/warios-smashed')
        .expect(200)
        .end(done);
    });
  });


  describe('DELETE /games/:game_slug/leaderboards/:board_slug', function () {
    it('should respond with a success message', function (done) {
      request(api.app.listen())
        .delete('/games/mario-bros/leaderboards/warios-smashed')
        .expect(200)
        .end(done);
    });
  });
});
