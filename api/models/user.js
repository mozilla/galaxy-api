'use strict';
var Steam = require('steam');


var internals = {
  publicFields: [
  ]
};


function User() {
}


User.getPublicObj = function (row) {
  var publicObj = {};
  internals.publicFields.forEach(function (key) {
    publicObj[key] = row[key];
  });
  return publicObj;
};


User.login = function () {

  return new Promise(function () {

    console.log('login');
    var bot = new Steam.SteamClient();
    bot.logOn({
      accountName: 'username',
      password: 'password'
    });
    bot.on('loggedOn', function() { /* ... */});
  });
};


User.objects = {};


User.objects.all = function () {
  return new Promise(function () {
  });
};


User.objects.create = function () {
  return new Promise(function () {
  });
};


User.objects._select = function () {
  return new Promise(function () {
  });
};


User.objects.get = function (data) {
  return User.objects._select(data, '*');
};


User.objects.exists = function (data) {
  return User.objects._select(data, '1');
};


User.objects.remove = function () {
  return new Promise(function () {
  });
};


User.objects.update = function () {
  return new Promise(function () {
  });
};


module.exports = User;
