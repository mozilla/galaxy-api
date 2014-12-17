var Promise = require('es6-promise').Promise;


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

Game.get = function get(data) {
  return new Promise(function (resolve, reject) {



  });
};

module.exports = Game;
