'use strict';
var Lab = require('lab');
var Code = require('code');


var lab = exports.lab = Lab.script();
var req;
var server = require('../../../');


lab.experiment('game creation', function () {


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

    req = {
      method: 'POST',
      url: '/games',
      payload: {
        name: 'no flex zone',
        slug: 'no-flex-zone',
        game_url: 'https://no.flexzo.ne'
      }
    };

    server.inject(req, function (res) {

      Code.expect(res.result).to.be.an.object().and
          .not.contain(['error', 'validation']);

      Code.expect(res.result).to.only.contain({
        name: req.payload.name,
        slug: req.payload.slug,
        game_url: req.payload.game_url,
        description: null
      });

      Code.expect(res.statusCode).to.equal(201);
      Code.expect(res.headers.location).to.equal(
        '/games/' + req.payload.slug);

      done();
    });
  });

});
