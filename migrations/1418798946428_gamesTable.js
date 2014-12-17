exports.up = function (pgm, run) {
  pgm.createTable('games', {
    id: {type: 'serial', primaryKey: true},
    description: {type: 'string'},
    game_url: {type: 'string', unique: true},
    name: {type: 'string'},
    slug: {type: 'string', unique: true},
    created: {type: 'datetime'},
    modified: {type: 'datetime'}
  });
  run();
};

exports.down = function (pgm, run) {
  pgm.dropTable('games');
  run();
};
