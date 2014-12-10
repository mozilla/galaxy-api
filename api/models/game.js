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
  this.slug = this.slug();

  this.task = task || 'New Task';
  this.category = category || 'General';
  this.priority = priority || 1;
  this.endDate = endDate || 'No End Date';
  this.isDone = false;
}

module.exports = Game;
