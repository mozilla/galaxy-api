exports.up = function (pgm, run) {
  pgm.createTable('games', {
    id: {type: 'serial', primaryKey: true},
    slug: {type: 'string', unique: true},
    game_url: {type: 'string', unique: true},
    name: {type: 'string'},
    description: {type: 'string'},
    created: {type: 'datetime'},
    modified: {type: 'datetime'}
  });
  run();
};

exports.down = function (pgm, run) {
  pgm.dropTable('games');
  run();
};
