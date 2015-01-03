var exec = require('child_process').exec;

var argv = require('yargs').argv;  // Using instead of deprecated `gulp.env`.
var inquirer = require('inquirer');
var Promise = require('es6-promise').Promise;
var stylish = require('jshint-stylish');

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var runSequence = require('run-sequence');
var shell = require('gulp-shell');

var settings = require('./settings');


var internals = {
  dbUrl: settings.POSTGRES_URL,
  dbName: settings.POSTGRES_URL.substring(
    settings.POSTGRES_URL.lastIndexOf('/') + 1
  ),
  sources: {
    scripts: [
      '*.js',
      'api/**/*.js',
      'lib/**/*.js'
    ]
  }
};


gulp.task('lint', function () {
  return gulp.src(internals.sources.scripts)
    .pipe(jshint({esnext: true}))
    .pipe(jshint.reporter(stylish));
});


gulp.task('createdb', shell.task([
  'createdb ' + internals.dbName
]));


gulp.task('dropdb', shell.task([
  'dropdb --if-exists ' + internals.dbName
]));


gulp.task('migratedb', ['migratedb-up']);


// Sample usage:
//
//   gulp migrate-up
//   gulp migrate-up --num 3
//
gulp.task('migratedb-up', shell.task([
  'DATABASE_URL="' + internals.dbUrl + '" ' +
  'node node_modules/.bin/pg-migrate up ' +
  (argv.num || argv.number || argv.n || '')
]));


// Sample usage:
//
//   gulp migrate-down
//   gulp migrate-down --num 3
//
gulp.task('migratedb-down', shell.task([
  'DATABASE_URL="' + internals.dbUrl + '" ' +
  'node node_modules/.bin/pg-migrate down ' +
  (argv.num || argv.number || argv.n || '')
]));


// Sample usage:
//
//   gulp migrate-down
//   gulp migrate-down --name addTimestampColumn
//
gulp.task('migratedb-create', shell.task([
  'DATABASE_URL="' + internals.dbUrl + '" ' +
  'node node_modules/.bin/pg-migrate create ' +
  (argv.name || argv.n || '')
]));


gulp.task('refreshdb', function (cb) {
  var runNow = function () {
    return runSequence(
      'dropdb',
      'createdb',
      'migratedb',
      cb
    );
  };

  if (process.argv.indexOf('--no-prompt') !== -1) {
    return runNow();
  }

  inquirer.prompt({
    type: 'confirm',
    name: 'val',
    message: 'Are you sure you want to drop the database?',
    default: false
  }, function (res) {
    if (!res.val) {
      return cb();
    }

    runNow();
  });
});
