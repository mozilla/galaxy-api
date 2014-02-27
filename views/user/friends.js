var _ = require('lodash');

var auth = require('../../lib/auth');
var db = require('../../db');
var user = require('../../lib/user');


module.exports.getNonfriendsFromEmail =
    db.redisView(function(client, done, req, res) {
        var GET = req.params;
        var email = req._email;

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
    });

module.exports.postFriendRequest =
    db.redisView(function(client, done, req, res) {
        var POST = req.params;
        var email = req._email;
        var recipient = POST.recipient;

        user.getUserIDFromEmail(client, email, function(err, id) {
            if (err || !id) {
                res.json(500, {error: err || 'db_error'});
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
            res.json(202, {success: true});
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
    });

module.exports.getFriendRequests =
    db.redisView(function(client, done, req, res) {
        var GET = req.params;
        var email = req._email;

        user.getUserIDFromEmail(client, email, function(err, id) {
            if (err || !id) {
                res.json(500, {error: err || 'db_error'});
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
    });

module.exports.postAcceptFriendRequest =
    db.redisView(function(client, done, req, res) {
        var POST = req.params;
        var email = req._email;
        var acceptee = POST.acceptee;

        user.getUserIDFromEmail(client, email, function(err, id) {
            if (err || !id) {
                res.json(500, {error: err || 'db_error'});
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
            res.json(202, {success: true});
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
    });

module.exports.postIgnoreRequest =
    db.redisView(function(client, done, req, res) {
        var POST = req.params;
        var email = req._email;
        var rejectee = POST.rejectee;

        user.getUserIDFromEmail(client, email, function(err, id) {
            if (err || !id) {
                res.json(500, {error: err || 'db_error'});
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
                res.json(202, {success: true});
                done();
            });
        });
    });

module.exports.postUnfriend =
    db.redisView(function(client, done, req, res) {
        var POST = req.params;
        var email = req._email;
        var exfriend = POST.exfriend;

        user.getUserIDFromEmail(client, email, function(err, id) {
            if (err || !id) {
                res.json(500, {error: err || 'db_error'});
                done();
                return;
            }
            checkFriendExists(id);
        });

        function checkFriendExists(id) {
            client.sismember('friends:' + id, exfriend, function(err, resp) {
                if (err || !resp) {
                    res.json(400, {error: 'friend_not_found'});
                    done();
                    return;
                }
                unfriendFriend(id);
            });
        }

        function unfriendFriend(id) {
            client.srem('friends:' + exfriend, id);
            client.srem('friends:' + id, exfriend);
            res.json(202, {success: true});
            done();
        }
    });
