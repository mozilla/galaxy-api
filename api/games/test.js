var request = require('supertest');

var api = require('../..');


describe('Games', function() {

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


  describe('GET /games', function () {
    it('should respond with a list of games', function (done) {
      request(api.app.listen())
        .get('/games')
        .expect(200)
        .end(done);
    });
  });


  describe('POST /games/', function () {
    it('should respond with a success message', function (done) {
      request(api.app.listen())
        .post('/games')
        .send({ game_url: 'http://mygame.example.org', name: 'My Game', slug: 'abcdef123456' })
        .expect(200)
        .end(done);
    });

    it('should respond with an error when all arguments are missing', function (done) {
      request(api.app.listen())
        .post('/games')
        .expect(400)
        .end(done);
    });

    it('should respond with an error when `game_url` is missing', function (done) {
      request(api.app.listen())
        .post('/games')
        .send({ name: 'My Game', slug: 'abcdef123456' })
        .expect(400)
        .end(done);
    });

    it('should respond with an error when `name` is missing', function (done) {
      request(api.app.listen())
        .post('/games')
        .send({ game_url: 'http://mygame.example.org', slug: 'abcdef123456' })
        .expect(400)
        .end(done);
    });

    it('should respond with an error when `slug` is missing', function (done) {
      request(api.app.listen())
        .post('/games')
        .send({ game_url: 'http://mygame.example.org', name: 'My Game' })
        .expect(400)
        .end(done);
    });
  });


  describe('GET /games/:slug', function () {
    it('should respond with a single game', function (done) {
      request(api.app.listen())
        .get('/games/le-game')
        .expect(200)
        .end(done);
    });

    it('should respond with an error message when the game does not exist', function (done) {
      request(api.app.listen())
        .get('/games/nononono')  // That game's URL would probably be http://youtu.be/oKI-tD0L18A
        .expect(404)
        .end(done);
    });
  });


  describe('PATCH /games/:slug', function () {
    it('should respond with a success message', function (done) {
      // Suddenly le game becomes Italian...
      request(api.app.listen())
        .patch('/games/le-game')
        .send({ slug: 'il-game', name: 'Il Game', game_url: 'http://il.ga.me' })
        .expect(200)
        .end(function () {
          // Now verify those changes where correctly applied.
          request(api.app.listen())
            .get('/games/il-game')
            .expect(/Il Game/)
            .expect(200)
            .end(done);
        });
    });

    it('should respond with an error message when the game does not exist', function (done) {
      request(api.app.listen())
        .patch('/games/nononono')
        .send({ slug: 'il-game', name: 'Il Game', game_url: 'http://il.ga.me' })
        .expect(404)
        .end(done);
    });
  });


  describe('DELETE /games/:slug', function () {
    it('should respond with a success message', function (done) {
      // First create a game that we can then delete.
      api.app.redis.hset(
        'game',
        'mario-boss',
        '{"slug": "mario-boss", "name": "Mario Boss", "game_url": "http://mario-boss.com"}'
      ).then(function () {
        request(api.app.listen())
          .delete('/games/mario-boss')
          .expect(200)
          .end(done);
      });
    });

    it('should respond with an error message when the game does not exist', function (done) {
      request(api.app.listen())
        .delete('/games/nononono')
        .expect(404)
        .end(done);
    });
  });
});
