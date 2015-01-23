'use strict';

var UUID = require('node-uuid');

var db = require('../../lib/db');
var utils = require('../../lib/utils');


var internals = {
  publicFields: [
    'slug',
    'game_url',
    'name',
    'description',
  ]
};


function Game(data) {
  // Game ID.
  // - Primary key auto-incremented upon creation.
  this.id = data.id;

  // Game Unique ID.
  // - Unique identifier auto-generated upon creation.
  // - Cannot be modified after creation.
  // - Used for querying instead of `id`.
  this.uuid = data.uuid;

  // Game Slug.
  // - Cannot be all digits, all underscores, or all hyphens.
  // - Must contain only letters, numbers, underscores, and hyphens.
  // - Unique.
  this.slug = data.slug;

  // Game URL.
  // - Must start with `https://` or `http://`.
  // - Unique.
  this.game_url = data.game_url;

  // Game Name.
  // - Cannot be longer than 150 characters.
  this.name = data.name;

  // Game Description.
  // - Optional.
  this.description = data.description;

  // Date Created.
  // - Timestamp auto-generated upon creation.
  this.created = data.created;

  // Date Modified.
  // - Timestamp auto-generated upon update.
  this.modified = data.modified;

  // Deleted.
  // - Boolean of whether the game was soft-deleted.
  // - Defaults to `false`.
  this.deleted = data.deleted;
}


Game.getPublicObj = function (row) {
  var publicObj = {};
  internals.publicFields.forEach(function (key) {
    publicObj[key] = row[key];
  });
  return publicObj;
};


Game.objects = {};


Game.objects.all = function () {
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


Game.objects.create = function (data) {
  return new Promise(function (resolve, reject) {
    db.query(
      'INSERT INTO games (uuid, slug, game_url, name, description, created) ' +
      'VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [UUID.v4(), data.slug, data.game_url, data.name, data.description],
      function (err, result) {

      if (err) {
        return reject(utils.errors.DatabaseError(err));
      }

      // This should never be possible.
      if (!result.rowCount) {
        return reject(utils.errors.DoesNotExist());
      }

      resolve(result.rows[0]);
    });
  });
};


Game.objects._select = function (data, columns) {
  return new Promise(function (resolve, reject) {
    var query = (utils.isStringAnInt(data.idOrSlug) ?
      'SELECT ' + columns + ' FROM games WHERE uuid = $1 AND deleted = false' :
      'SELECT ' + columns + ' FROM games WHERE slug = $1 AND deleted = false'
    );

    db.query(query, [data.idOrSlug], function (err, result) {
      if (err) {
        return reject(utils.errors.DatabaseError(err));
      }

      if (!result.rowCount) {
        return reject(utils.errors.DoesNotExist());
      }

      resolve(columns === '1' ? true : result.rows[0]);
    });
  });
};


Game.objects.get = function (data) {
  return Game.objects._select(data, '*');
};


Game.objects.exists = function (data) {
  return Game.objects._select(data, '1');
};


Game.objects.remove = function (data) {
  return Game.objects.exists(data).then(function () {

    return new Promise(function (resolve, reject) {
      var query = (utils.isStringAnInt(data.idOrSlug) ?
        'UPDATE games SET deleted = true WHERE uuid = $1' :
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


Game.objects.update = function (dataToFetchBy, dataToSave) {
  return Game.objects.get(dataToFetchBy).then(function (game) {

    return new Promise(function (resolve, reject) {
      db.query(
        'UPDATE games SET slug = $1, game_url = $2, name = $3, ' +
        'description = $4, modified = NOW() WHERE uuid = $5 RETURNING *',
        [dataToSave.slug, dataToSave.game_url, dataToSave.name,
         dataToSave.description, game.uuid], function (err, result) {

        if (err) {
          return reject(utils.errors.DatabaseError(err));
        }

        // This should never be possible.
        if (!result.rowCount) {
          return reject(utils.errors.DoesNotExist());
        }

        var res = result.rows[0];

        if (game.slug !== res.slug) {
          res._slugChanged = true;
        }

        resolve(res);
      });
    });

  });
};


module.exports = Game;
