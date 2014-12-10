var pg = require('pg');

var settings = require('../../settings');


module.exports = {
  insert: function () {
  },
  select: function () {
  }
};

// Establish connection to PostgreSQL database.
pg.connect(settings.POSTGRES_URL, function (err, client, done) {
  if (err) {
    return console.error('Error fetching client from pool: %s', err);
  }

  client.query('SELECT $1::int AS number', ['1'], function (err, result) {
    // Call `done()` to release the client back to the pool.
    done();

    if (err) {
      return console.error('Error running query: %s', err);
    }

    // Output: 1
    console.log(result.rows[0].number);
  });
});
