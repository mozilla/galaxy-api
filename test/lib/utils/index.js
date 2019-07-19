'use strict';

var Lab = require('lab');
var Code = require('code');

var utils = require('../../../lib/utils');


var lab = exports.lab = Lab.script();


lab.experiment('utils.errors', function () {

  lab.test('returns an object of error types', function (done) {

    Code.expect(utils.errors).to.be.an.object().and
        .include(['DatabaseError', 'DoesNotExist', 'ValidationError']);
    done();
  });

  lab.test('error type returns a function', function (done) {

    Code.expect(utils.errors.DatabaseError).to.be.a.function();
    done();
  });

  lab.test('error function returns an object', function (done) {

    Code.expect(utils.errors.DatabaseError()).to.only.include({
      name: 'DatabaseError',
      message: undefined
    });
    done();
  });

  lab.test(
    'error function with message returns an object with message',
    function (done) {

      Code.expect(
        utils.errors.DatabaseError('too_much_big_data')
      ).to.only.include({
        name: 'DatabaseError',
        message: 'too_much_big_data'
      });
      done();
    }
  );
});


lab.experiment('utils.isStringAUuid', function () {

  lab.test('returns true for uuid v4', function (done) {

    Code.expect(utils.isStringAUuid('dcfe8eb3-073d-4f22-8fa9-ae3680e877b0'))
        .to.equal(true);
    Code.expect(utils.isStringAUuid('a262a8a2-f5d5-49df-b9e3-88bfdfe22e10'))
        .to.equal(true);
    done();
  });

  lab.test('returns false for uuid non-v4', function (done) {

    // UUID v1
    Code.expect(utils.isStringAUuid('e5d453c0-9ca9-11e4-89d3-123b93f75cba'))
        .to.equal(false);
    // UUID v3
    Code.expect(utils.isStringAUuid('bfd28b1c-0c1f-9045-90e2-09e65d58c518'))
        .to.equal(false);
    done();
  });

  lab.test('returns false for strings', function (done) {

    Code.expect(utils.isStringAUuid('a')).to.equal(false);
    done();
  });

  lab.test('returns false for strings with integers', function (done) {

    Code.expect(utils.isStringAUuid('a5')).to.equal(false);
    done();
  });

  lab.test('returns false for floats', function (done) {

    Code.expect(utils.isStringAUuid('5.0')).to.equal(false);
    done();
  });
});


lab.experiment('utils.stringifyObject', function () {

  lab.test('returns stringified object for empty object', function (done) {

    Code.expect(utils.stringifyObject({})).to.equal('{}');
    done();
  });

  lab.test('returns stringified object for non-empty object', function (done) {

    Code.expect(utils.stringifyObject({lol: 'swag'}))
        .to.equal('{"lol":"swag"}');
    done();
  });

  lab.test('returns stringified "null" for null', function (done) {

    Code.expect(utils.stringifyObject(null)).to.equal('null');
    done();
  });

  lab.test('returns original argument for string', function (done) {

    Code.expect(utils.stringifyObject('lol')).to.equal('lol');
    done();
  });
});


lab.experiment('utils.promisify', function () {

  lab.test('assignment returns function for callback', function (done) {

    var cb = function () {};

    Code.expect(utils.promisify(cb)).to.be.a.function();
    done();
  });

  lab.test('assignment returns function for Promise', function (done) {

    var prom = new Promise(function () {});

    Code.expect(utils.promisify(prom)).to.be.a.function();
    done();
  });

  lab.test('caller returns Promise for callback', function (done) {

    var cb = function () {};
    var promisified = utils.promisify(cb)();

    Code.expect(promisified).to.not.equal(cb);
    Code.expect(promisified).to.be.an.object();
    Code.expect(promisified.then).to.be.a.function();
    done();
  });

  lab.test(
    'caller returns resolved Promise for success callback',
    function (done) {

      var badError = new Error('bad');
      var cb = function (callme) {
        return callme(badError);
      };
      var promisified = utils.promisify(cb)();

      promisified.then(function (value) {
        Code.expect(value).to.not.exist();
        done();
      }, function (err) {
        Code.expect(err).to.equal(badError);
        done();
      }
    );
  });

  lab.test(
    'caller returns rejected Promise for error callback',
    function (done) {

      var cb = function (callme) {
        return callme(null, 'good');
      };
      var promisified = utils.promisify(cb)();

      promisified.then(function (value) {
        Code.expect(value).to.equal('good');
        done();
      }, function (err) {
        Code.expect(err).to.not.exist();
        done();
      }
    );
  });

  lab.test('caller returns original Promise for Promise', function (done) {

    var prom = new Promise(function () {});
    var promisified = utils.promisify(prom)();

    Code.expect(promisified).to.equal(prom);
    done();
  });
});


lab.experiment('utils.returnError', function () {

  lab.test(
    'returns generic 500 Boom object for unrecognised error',
    function (done) {

      var err = utils.returnError('something_bad_happened');
      Code.expect(err).to.include({
        isBoom: true,
        isDeveloperError: true
      });
      Code.expect(err.output.payload).to.include({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An internal server error occurred'
      });
      done();
    }
  );

  lab.test(
    'returns generic 500 Boom object for unrecognised Error',
    function (done) {

      var err = utils.returnError(new Error('something_bad_happened'));
      Code.expect(err).to.include({
        isBoom: true,
        isDeveloperError: true
      });
      Code.expect(err.output.payload).to.include({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An internal server error occurred'
      });
      done();
    }
  );

  lab.test(
    'returns generic 500 Boom object for unrecognised object',
    function (done) {

      var err = utils.returnError({error: 'something_bad_happened'});
      Code.expect(err).to.include({
        isBoom: true,
        isDeveloperError: true
      });
      Code.expect(err.output.payload).to.include({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An internal server error occurred'
      });
      done();
    }
  );

  lab.test(
    'returns generic 500 Boom object for DatabaseError',
    function (done) {

      var err = utils.returnError({
        name: 'DatabaseError',
        message: 'Foreign Key error!'
      });
      Code.expect(err).to.include({isBoom: true}).and.not.include({
        isDeveloperError: true
      });
      Code.expect(err.output.payload).to.include({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An internal server error occurred'
      });
      done();
    }
  );

  lab.test(
    'returns descriptive 404 Boom object for DoesNotExist',
    function (done) {

      var err = utils.returnError({
        name: 'DoesNotExist',
        message: 'Did you check Lost and Found?'
      });
      Code.expect(err).to.include({isBoom: true}).and.not.include({
        isDeveloperError: true
      });
      Code.expect(err.output.payload).to.include({
        statusCode: 404,
        error: 'Not Found',
        message: 'Did you check Lost and Found?'
      });
      done();
    }
  );

  lab.test(
    'returns descriptive 400 Boom object for ValidationError',
    function (done) {

      var err = utils.returnError({
        name: 'ValidationError',
        message: 'Marine biologists never make mistakes on porpoise!'
      });
      Code.expect(err).to.include({isBoom: true}).and.not.include({
        isDeveloperError: true
      });
      Code.expect(err.output.payload).to.include({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Marine biologists never make mistakes on porpoise!'
      });
      done();
    }
  );
});
