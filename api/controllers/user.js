'use strict';

var User = require('../models/user');


exports.login = {
  handler: function (request, reply) {

    return User.login(request.params)
    .then(function (user) {

      reply(User.getPublicObj(user));
    });
  }
};
