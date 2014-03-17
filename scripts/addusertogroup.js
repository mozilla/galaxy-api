#!/usr/bin/env node

/*

    Sample usage:

        ./scripts/addusertogroup.js cvan@mozilla.com admin

        ./scripts/addusertogroup.js cvan@mozilla.com admin reviewer

*/

var userlib = require('../lib/user');
var db = require('../db');


if (process.argv.length < 4) {
    console.log('Usage:', process.argv[1], '<userID | email> <permissions>');
    process.exit(1);
}

var client = db.redis();

var idOrEmail = process.argv[2];
var groups = process.argv.slice(3);
var lookupMethod = userlib.getUserFromID;
var isEmail = false;

if (idOrEmail.indexOf('@') !== -1) {
    lookupMethod = userlib.getUserFromEmail;
    isEmail = true;
}

console.log('Attempting to add user <' + idOrEmail +
            '> to groups <' + groups.join(', ') + '>');

lookupMethod(client, idOrEmail, function (err, user) {
    if (err) {
        if (err === 'no_such_user' && !user && isEmail) {
            console.log('User <' + idOrEmail + '> does not exist, creating now');
            user = userlib.newUser(client, idOrEmail);
        } else {
            return console.error(err);
        }
    }

    if (!user) {
        return console.error('Could not retrieve user');
    }

    var permissions = {};
    ['developer', 'reviewer', 'admin'].forEach(function (group) {
        if (groups.indexOf(group) !== -1) {
            permissions[group] = true;
        }
    });

    userlib.updateUser(client, user.id, {
        modified: new Date(),
        permissions: permissions
    }, function(err, newData) {
        if (err) {
            console.error('Error:\n' + err);
        } else {
            var output = JSON.stringify(newData, null, 2);
            console.log('Success:\n' + output.replace(/^|\n|$/g, '\n  '));
        }
        client.end();
    });
});
