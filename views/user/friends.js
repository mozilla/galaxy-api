var auth = require('../../lib/auth');
var db = require('../../db');
var user = require('../../lib/user');


module.exports = function(server) {
    // Sample usage:
    // % curl 'http://localhost:5000/user/friends?_user=ssatoken'
    /*
    Optional params:
    ?only={online|played|playedOnline|playing}
    &game=<game>
    */
    server.get({
        url: '/user/friends',
        validation: {
            _user: {
                description: "A user's SSA token",
                isRequired: true
            }
        }
    }, db.redisView(function(client, done, req, res) {
        var GET = req.params;

        var _user = GET._user;
        var email;
        if (!(email = auth.verifySSA(_user))) {
            res.json(403, {error: 'bad_user'});
            done();
            return;
        }

        user.getUserIDFromEmail(client, email, function(err, id) {
            if (err || !id) {
                res.json(500, {error: err || 'db_error'});
                done();
                return;
            }

            (function(cb) {
                var friends = 'friends:' + id;
                if (GET.only === 'online') {
                    return client.sinter(friends, 'authenticated', cb);
                } else if (GET.only === 'played' && GET.game) {
                    return client.sinter(friends, 'gamePlayed:' + GET.game, cb);
                } else if (GET.only === 'playedOnline' && GET.game) {
                    return client.sinter(friends, 'authenticated', 'gamePlayed:' + GET.game, cb);
                } else if (GET.only === 'playing' && GET.game) {
                    return client.sinter(friends, 'gamePlaying:' + GET.game, cb);
                } else {
                    return client.smembers(friends, cb);
                }
            })(function(err, friends) {
                if (err || !friends) {
                    res.json(400, {error: 'no_friends'});
                    done();
                    return;
                }
                user.getPublicUserObjList(client, friends, function(objs) {
                    done();
                    res.json(objs);
                });
            });
        });
    }));

    // Sample usage:
    // % curl -X POST 'http://localhost:5000/user/friends' -d '_user=ssatoken&recipient=uid'
    server.post({
        url: '/user/friends/request',
        swagger: {
            nickname: 'request-friend',
            notes: 'Requests two users become friends',
            summary: 'Send friend request'
        },
        validation: {
            _user: {
                description: 'A user\'s SSA token.',
                isRequired: true
            },
            recipient: {
                description: 'The user ID of the friend request recipient',
                isRequired: true
            }
        }
    }, db.redisView(function(client, done, req, res) {
        var POST = req.params;

        var _user = POST._user;
        var email;
        if (!(email = auth.verifySSA(_user))) {
            res.json(403, {error: 'bad_user'});
            done();
            return;
        }

        var recipient = POST.recipient;

        user.getUserIDFromEmail(client, email, function(err, id) {
            if (err || !id) {
                res.json(500, {error: err || 'db_eror'});
                done();
                return;
            }
            checkRecipient(id);
        });

        function checkRecipient(id) {
            client.hexists('users', recipient, function(err, resp) {
                if (err || !resp) {
                    res.json(400, {error: 'bad_recipient'});
                    done();
                    return;
                }
                checkNotFriends(id);
            });
        }
        function checkNotFriends(id) {
            client.sismember('friends:' + id, recipient, function(err, resp) {
                if (err || resp) {
                    res.json(400, {error: 'already_friends'});
                    done();
                    return;
                }
                checkNotFriendRequested(id);
            });
        }
        function checkNotFriendRequested(id) {
            client.sismember('friendRequests:' + id, recipient, function(err, resp) {
                if (err || resp) {
                    res.json(400, {error: 'already_requested'});
                    done();
                    return;
                }
                addFriendRequest(id);
            });
        }
        function addFriendRequest(id) {
            client.sadd('friendRequests:' + recipient, id);
            res.json(204, {error: null});
            // If the sender's request is fulfilled, publish the recipient a notification.
            client.sismember('ignoredFriendRequests:' + recipient, id, function(err, resp) {
                if (!resp) {
                    user.getUserFromID(client, id, function(err, publicUser) {
                        if (err || !publicUser) {
                            done();
                            return;
                        }
                        client.publish('user:' + recipient, JSON.stringify({
                            type: 'notification',
                            notification_type: 'friend_request',
                            from: publicUser
                        }));
                        done();
                    });
                }
            });
        }
    }));

    server.get({
        url: '/user/friends/requests',
        swagger: {
            nickname: 'friend-requests',
            notes: 'Returns a list of friend requests for the user.',
            summary: 'List of friend requests'
        },
        validation: {
            _user: {
                description: 'A user\'s SSA token',
                isRequired: true
            }
        }
    }, db.redisView(function(client, done, req, res) {
        var GET = req.params;

        var _user = GET._user;
        var email;
        if (!(email = auth.verifySSA(_user))) {
            res.json(403, {error: 'bad_user'});
            done();
            return;
        }

        user.getUserIDFromEmail(client, email, function(err, id) {
            if (err || !id) {
                res.json(500, {error: err || 'db_eror'});
                done();
                return;
            }
            client.sdiff(
                'friendRequests:' + id,
                'ignoredFriendRequests:' + id,
                function(err, friends) {
                    if (err || !friends) {
                        res.json(500, {error: 'no_friends'});
                        done();
                        return;
                    }
                    user.getPublicUserObjList(client, friends, function(objs) {
                        done();
                        res.json(objs);
                    });
                }
            );
        });
    }));

    server.post({
        url: '/user/friends/accept',
        swagger: {
            nickname: 'accept-friend',
            notes: 'Accepts a friend request',
            summary: 'Accept friend request'
        },
        validation: {
            _user: {
                description: 'A user\'s SSA token.',
                isRequired: true
            },
            acceptee: {
                description: 'The user ID of someone who sent a friend request to the user',
                isRequired: true
            }
        }
    }, db.redisView(function(client, done, req, res) {
        var POST = req.params;

        var _user = POST._user;
        var email;
        if (!(email = auth.verifySSA(_user))) {
            res.json(403, {error: 'bad_user'});
            done();
            return;
        }

        var acceptee = POST.acceptee;

        user.getUserIDFromEmail(client, email, function(err, id) {
            if (err || !id) {
                res.json(500, {error: err || 'db_eror'});
                done();
                return;
            }
            checkRequestExists(id);
        });

        function checkRequestExists(id) {
            client.sismember('friendRequests:' + id, acceptee, function(err, resp) {
                if (err || !resp) {
                    res.json(400, {error: 'request_not_found'});
                    done();
                    return;
                }
                addFriends(id);
            });
        }
        function addFriends(id) {
            client.sadd('friends:' + acceptee, id);
            client.sadd('friends:' + id, acceptee);
            client.srem('friendRequests:' + acceptee, id);
            client.srem('friendRequests:' + id, acceptee);
            client.srem('ignoreFriendRequests:' + acceptee, id);
            client.srem('ignoreFriendRequests:' + id, acceptee);
            res.json(204, {error: null});
            // If the sender's request is fulfilled, publish the recipient a notification.
            user.getUserFromID(client, id, function(err, publicUser) {
                if (err || !publicUser) {
                    done();
                    return;
                }
                client.publish('user:' + acceptee, JSON.stringify({
                    type: 'notification',
                    notification_type: 'friend_request_accepted',
                    from: publicUser
                }));
                done();
            });
        }
    }));

    server.post({
        url: '/user/friends/ignore',
        swagger: {
            nickname: 'ignore-friend',
            notes: 'Ignored an incoming friend request',
            summary: 'Ignore friend request'
        },
        validation: {
            _user: {
                description: 'A user\'s SSA token.',
                isRequired: true
            },
            acceptee: {
                description: 'The user ID of someone who sent a friend request to the user',
                isRequired: true
            }
        }
    }, db.redisView(function(client, done, req, res) {
        var POST = req.params;

        var _user = POST._user;
        var email;
        if (!(email = auth.verifySSA(_user))) {
            res.json(403, {error: 'bad_user'});
            done();
            return;
        }

        var rejectee = POST.rejectee;

        user.getUserIDFromEmail(client, email, function(err, id) {
            if (err || !id) {
                res.json(500, {error: err || 'db_eror'});
                done();
                return;
            }
            client.sismember('friendRequests:' + id, rejectee, function(err, resp) {
                if (err || !resp) {
                    res.json(400, {error: 'request_not_found'});
                    done();
                    return;
                }
                client.sadd('ignoreFriendRequests:' + id, rejectee);
                res.json(204, {error: null});
                done();
            });
        });

    }));
};
