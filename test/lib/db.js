'use strict';
var Lab = require('lab');
var Code = require('code');

var db = require('../../lib/db');
var settings = require('../../settings');


var lab = exports.lab = Lab.script();
var expect = Code.expect;


function setUpAndTearDown() {
  lab.before(function (done) {

    if (db.isConnected()) {
      db.disconnect();
    }
    done();
  });


  lab.after(function (done) {

    if (!db.isConnected()) {
      db.connect(settings.POSTGRES_URL);
    }
    done();
  });
}


lab.experiment('db.connect', function () {


  setUpAndTearDown();


  lab.test('throws on missing connection string', function (done) {

    expect(function () {

      db.connect();
    }).to.throw('value is required');

    done();
  });


  lab.test('throws on missing empty string', function (done) {

    expect(function () {

      db.connect('');
    }).to.throw('value is not allowed to be empty');

    done();
  });


  lab.test('throws an error on invalid connection string', function (done) {

    expect(function () {

      db.connect('postgres://localhost');
    }).to.throw('value fails to match the required pattern');

    done();
  });


  lab.test('succeeds with valid connection string', function (done) {

    expect(function () {

      db.connect(settings.POSTGRES_URL);
    }).to.not.throw();

    db.disconnect();

    done();
  });
});


lab.experiment('db.disconnect', function () {


  setUpAndTearDown();


  lab.test('throws when server not connected', function (done) {

    expect(function () {

      db.disconnect();
    }).to.throw('Server not connected');

    done();
  });


  lab.test('succeeds when server is connected with valid connection string', function (done) {

    expect(function () {

      db.connect(settings.POSTGRES_URL);
      db.disconnect();
    }).to.not.throw();

    done();
  });
});


lab.experiment('db.query', function () {

  setUpAndTearDown();


  lab.test('throws when server not connected', function (done) {

    expect(function () {

      db.query();
    }).to.throw('Server not connected');

    done();
  });


  lab.test('succeeds when server is connected with valid connection string', function (done) {

    expect(function () {

      db.connect(settings.POSTGRES_URL);
      db.query('SELECT 1 FROM games', function (err, result) {

        expect(result.rowCount).to.equal(1);
        done();
      });
    }).to.not.throw();
  });
});
