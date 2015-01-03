exports.up = function (pgm, run) {
  pgm.addColumns('games', {
    deleted: {type: 'bool', default: 'false'}
  });
  run();
};

exports.down = function (pgm, run) {
  pgm.dropColumns('games', {
    deleted: {}
  });
  run();
};
