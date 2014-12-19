var Promise = require('es6-promise').Promise;

var utils = require('../../lib/utils');


function Game(data) {
  // Game Description is optional.
  this.description = data.description;

  // Game URL must start with `https://` or `http://`.
  this.game_url = data.game_url;

  // Game Name cannot be longer than 150 characters long.
  this.name = data.name;

  // Game Slug cannot be all digits, all underscores, or all hyphens
  // and must contain only letters, numbers, underscores, and hyphens.
  // The slug must also be unique.
  this.slug = data.slug;
}


Game.objects = {};


Game.objects.all = function (db, data) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT * FROM games WHERE deleted = false',
      function (err, result) {

      if (err) {
        return reject(utils.errors.DatabaseError(err));
      }

      resolve(result.rows);
    });
  });
};


Game.objects.create = function (db, data) {
  return new Promise(function (resolve, reject) {
    var game = new Game(data);

    db.query(
      'INSERT INTO games (slug, game_url, name, description, created) ' +
      'VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [game.slug, game.game_url, game.name, game.description],
      function (err, result) {

      if (err) {
        return reject(utils.errors.DatabaseError(err));
      }

      resolve(result.rows[0]);
    });
  });
};


Game.objects._select = function (db, data, columns) {
  return new Promise(function (resolve, reject) {
    var query = (utils.isNumeric(data.idOrSlug) ?
      'SELECT ' + columns + ' FROM games WHERE id = $1 AND deleted = false' :
      'SELECT ' + columns + ' FROM games WHERE slug = $1 AND deleted = false'
    );

    db.query(query, [data.idOrSlug], function (err, result) {
      if (err) {
        return reject(utils.errors.DatabaseError(err));
      }

      if (!result.rows.length) {
        return reject(utils.errors.DoesNotExist());
      }

      resolve(result.rows[0]);
    });
  });
};


Game.objects.get = function (db, data) {
  return Game.objects._select(db, data, '*');
};


Game.objects.exists = function (db, data) {
  return Game.objects._select(db, data, '1');
};


Game.objects.remove = function (db, data) {
  return Game.objects.exists(db, data).then(function () {

    return new Promise(function (resolve, reject) {
      var query = (utils.isNumeric(data.idOrSlug) ?
        'UPDATE games SET deleted = true WHERE id = $1' :
        'UPDATE games SET deleted = true WHERE slug = $1'
      );

      db.query(query, [data.idOrSlug], function (err, result) {
        if (err) {
          return reject(utils.errors.DatabaseError(err));
        }

        // This should never be possible.
        if (!result.rowCount) {
          return reject(utils.errors.ValidationError('already_deleted'));
        }

        resolve({success: true});
      });
    });

  });
};


module.exports = Game;
