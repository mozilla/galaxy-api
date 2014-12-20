var Lab = require('lab');
var Code = require('code');

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
