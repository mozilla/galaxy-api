var Lab = require('lab');
var Code = require('code');

var Promise = require('es6-promise').Promise;

var utils = require('../../../lib/utils');


var lab = exports.lab = Lab.script();


lab.experiment('utils.isStringAnInt', function () {

  lab.test('returns true for zero', function (done) {

    Code.expect(utils.isStringAnInt('0')).to.equal(true);
    done();
  });

  lab.test('returns true for positive integers', function (done) {

    Code.expect(utils.isStringAnInt('5')).to.equal(true);
    done();
  });

  lab.test('returns true for negative integers', function (done) {

    Code.expect(utils.isStringAnInt('5')).to.equal(true);
    done();
  });

  lab.test('returns false for strings', function (done) {

    Code.expect(utils.isStringAnInt('a')).to.equal(false);
    done();
  });

  lab.test('returns false for strings with integers', function (done) {

    Code.expect(utils.isStringAnInt('a5')).to.equal(false);
    done();
  });

  lab.test('returns false for floats', function (done) {

    Code.expect(utils.isStringAnInt('5.0')).to.equal(false);
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

  lab.test('caller returns resolved Promise for success callback', function (done) {

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
    });
  });

  lab.test('caller returns rejected Promise for error callback', function (done) {

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
    });
  });

  lab.test('caller returns original Promise for Promise', function (done) {

    var prom = new Promise(function () {});
    var promisified = utils.promisify(prom)();

    Code.expect(promisified).to.equal(prom);
    done();
  });
});
