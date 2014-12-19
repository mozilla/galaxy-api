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
