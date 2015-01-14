'use strict';
var Lab = require('lab');
var Code = require('code');

var Promise = require('es6-promise').Promise;

var db = require('../../../lib/db');
var server = require('../../../');


var lab = exports.lab = Lab.script();
var req;


var internals = {
  sampleGameObj: {
    name: 'no flex zone',
    slug: 'no-flex-zone',
    game_url: 'https://no.flexzo.ne',
    description: 'no flexing in this zone'
  }
};


function submitGame(done) {
  return new Promise(function (resolve) {
    req = {
      method: 'POST',
      url: '/games',
      payload: internals.sampleGameObj
    };

    server.inject(req, function (res) {

      Code.expect(res.result).to.be.an.object().and
          .not.contain(['error', 'validation']);

      Code.expect(res.result).to.deep.equal(internals.sampleGameObj);

      Code.expect(res.statusCode).to.equal(201);
      Code.expect(res.headers.location).to.equal('/games/no-flex-zone');

      var Game = require('../../../api/models/game');
      Game.objects.get({idOrSlug: internals.sampleGameObj.slug})
      .then(function (result) {

        Code.expect(result).to.contain(internals.sampleGameObj);
      }).then(function () {

        if (done) {
          resolve();
        } else {
          resolve(req);
        }
      });
    });
  });
}


lab.experiment('game creation', function () {


  // NOTE: This could be `after` instead of `afterEach` since only the last
  // test actually successfully inserts a row in the DB, but unit tests should
  // be individual units tested in isolation - so clear the DB after each test.
  // TODO: Use transactions for tests (issue #337).
  lab.afterEach(function (done) {

    db.query('TRUNCATE games', function () {
      done();
    });
  });


  lab.test('validation errors on empty payload', function (done) {

    req = {
      method: 'POST',
      url: '/games'
    };

    server.inject(req, function (res) {

      Code.expect(res.result).to.be.an.object().and
          .contain(['error', 'validation']);

      Code.expect(res.result.validation.source).to.equal('payload');
      Code.expect(res.result.validation.keys).to.only.contain([
        'game_url', 'name', 'slug'
      ]);

      Code.expect(res.statusCode).to.equal(400);

      done();
    });
  });


  lab.test('multiple validation errors on invalid payload', function (done) {

    req = {
      method: 'POST',
      url: '/games',
      payload: {
        name: 'no flex zone',  // Valid.
        slug: '123',  // Invalid: cannot be all numeric.
        game_url: 'badflexzo.ne'  // Invalid: must start with `https?://`.
      }
    };

    server.inject(req, function (res) {

      Code.expect(res.result).to.be.an.object().and
          .contain(['error', 'validation']);

      Code.expect(res.result.validation.source).to.equal('payload');

      // FYI: Fortunately, both errors are returned because we initialised
      // the server with `routes.validate.options.abortEarly = false` option.
      Code.expect(res.result.validation.keys).to.only.contain([
        'game_url', 'slug'
      ]);

      Code.expect(res.statusCode).to.equal(400);

      done();
    });
  });


  lab.test('success on valid payload', function (done) {

    submitGame(done).then(done);
  });
});


lab.experiment('game list', function () {


  lab.afterEach(function (done) {

    db.query('TRUNCATE games', function () {
      done();
    });
  });


  lab.test('returns an empty array when no games exist', function (done) {

    req = {
      method: 'GET',
      url: '/games'
    };

    server.inject(req, function (res) {

      Code.expect(res.result).to.be.an.empty().array();

      Code.expect(res.statusCode).to.equal(200);

      done();
    });
  });


  lab.test('returns an array when game(s) exist(s)', function (done) {

    submitGame().then(function () {

      req = {
        method: 'GET',
        url: '/games'
      };

      server.inject(req, function (res) {

        Code.expect(res.result).to.be.a.length(1).array();

        Code.expect(res.result[0]).to.deep.equal(internals.sampleGameObj);

        Code.expect(res.statusCode).to.equal(200);

        done();
      });
    });
  });
});


lab.experiment('game detail', function () {


  lab.afterEach(function (done) {

    db.query('TRUNCATE games', done);
  });


  lab.test('returns a 404 when game does not exist', function (done) {

    req = {
      method: 'GET',
      url: '/games/no-flex-zone'
    };

    server.inject(req, function (res) {

      Code.expect(res.statusCode).to.equal(404);

      done();
    });
  });


  lab.test('returns an object when game exists', function (done) {

    submitGame().then(function () {

      req = {
        method: 'GET',
        url: '/games/no-flex-zone'
      };

      server.inject(req, function (res) {

        Code.expect(res.result).to.deep.equal(internals.sampleGameObj);

        Code.expect(res.statusCode).to.equal(200);

        done();
      });
    });
  });
});
