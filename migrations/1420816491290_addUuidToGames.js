exports.up = function(pgm, run) {
  pgm.addColumns('games', {
    uuid: {type: 'string', unique: true}
  })
  run();
};

exports.down = function(pgm, run) {
  pgm.dropColumns('games', ['uuid']);
  run();
};
