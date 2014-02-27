var settings = require('./settings_local.js');

var db = require('./db');
var serverHTTP = require('./server_http');
var serverWS = require('./server_ws');

var auth = require('./lib/auth');
var user = require('./lib/user');


/*
 * Here lies the URL routing for all requests
 */

/*
 * game/board
 */

var gameBoard = require('./views/game/board');

// Sample usage:
// % curl 'http://localhost:5000/game/mario-bros/board'
serverHTTP.get({
    url: '/game/:game/board',
    swagger: {
        nickname: 'get-board',
        notes: 'Returns a list of the leaderboards boards that are ' +
               'available for a particular game.',
        summary: 'List of Leaderboards for a Game'
    }
}, gameBoard.getBoardList);

// Sample usage:
// % curl -X POST 'http://localhost:5000/game/mario-bros/board' -d 'name=Warios Smashed&slug=warios-smashed'
serverHTTP.post({
    url: '/game/:game/board',
    swagger: {
        nickname: 'create-board',
        notes: 'Creates a leaderboard board for a particular game.',
        summary: 'Create a Game Leaderboard'
    },
    validation: {
        name: {
            description: 'Board name',
            isRequired: true
        },
        slug: {
            description: 'Board slug',
            isRequired: true
        }
    }
}, gameBoard.postCreateLeaderboard);

// Sample usage:
// % curl -X DELETE 'http://localhost:5000/game/mario-bros/board' -d 'slug=warios-smashed'
serverHTTP.del({
    url: '/game/:game/board',
    swagger: {
        nickname: 'delete-board',
        notes: 'Removes a leaderboard from a particular game.',
        summary: 'Delete a Game Leaderboard'
    },
    validation: {
        slug: {
            description: 'Board slug',
            isRequired: true
        }
    }
}, gameBoard.delLeaderboard);

// Sample usage:
// % curl 'http://localhost:5000/game/mario-bros/board/warios-smashed'
// % curl 'http://localhost:5000/game/mario-bros/board/warios-smashed?sort=asc&friendsOnly=true&_user=ssa_token'
serverHTTP.get({
    url: '/game/:game/board/:board',
    swagger: {
        nickname: 'get-scores',
        notes: 'Returns the list of scores of a particular leaderboard',
        summary: 'List of Scores for LeaderBoard'
    },
    validation: {
        sort: {
            description: 'Sort order',
            isAlpha: true,
            isRequired: false
        },
        friendsOnly: {
            description: 'Only show score of friends',
            isRequired: false
        },
        _user: {
            description: 'User (ID or username slug)',
            isRequired: false
        },
        page: {
            description: 'Page number',
            isInt: true,
            isRequired: false
        },
        limit: {
            description: 'Number of results per page',
            isInt: true,
            isRequired: false
        }
    }
}, gameBoard.getScoresFromLeaderboard);

/*
 * game/detail
 */

var gameDetail = require('./views/game/detail');

// Sample usage:
// % curl 'http://localhost:5000/game/mario-bros/detail'
serverHTTP.get({
    url: '/game/:slug/detail',
    swagger: {
        nickname: 'detail',
        notes: 'Specific details and metadata about a game',
        summary: 'Game Details'
    }
}, gameDetail.getGameDetail);

/*
 * game/featured
 */

var gameFeatured = require('./views/game/featured');

// Sample usage:
// % curl 'http://localhost:5000/featured'
serverHTTP.get({
    url: '/featured',
    swagger: {
        nickname: 'featured',
        notes: 'Get the list of featured games',
        summary: 'List of featured games'
    },
    genre: {
        description: 'Genre',
        isRequired: false
    }
}, gameFeatured.getFeaturedList);

// Sample usage:
// % curl -X POST 'http://localhost:5000/featured' -d '_user=ssa_token&game=game_slug&genres=["action"]'
serverHTTP.post({
    url: '/featured',
    swagger: {
        nickname: 'add-featured',
        notes: 'Add a new featured game',
        summary: 'Add a new featured game'
    },
    validation: {
        _user: {
            description: 'User',
            isRequired: true
        },
        game: {
            description: 'Game slug',
            isRequired: true
        },
        genres: {
            description: 'List of genres',
            isRequired: false
        }
    }
}, gameFeatured.postAddFeatured);


// Sample usage:
// % curl -X PUT 'http://localhost:5000/featured' -d '_user=ssa_token&game=game_slug&genres=["simulation"]'
serverHTTP.put({
    url: '/featured',
    swagger: {
        nickname: 'put-featured',
        notes: 'Edit an existing featured game',
        summary: 'Edit a featured game'
    },
    validation: {
        _user: {
            description: 'User',
            isRequired: true
        },
        game: {
            description: 'Game slug',
            isRequired: true
        },
        genres: {
            description: 'List of genres',
            isRequired: false
        }
    }
}, gameFeatured.putEditFeatured);

// Sample usage:
// % curl -X DELETE 'http://localhost:5000/featured' -d '_user=ssa_token&game=game_slug'
serverHTTP.del({
    url: '/featured',
    swagger: {
        nickname: 'del-featured',
        notes: 'Delete an existing featured game',
        summary: 'Delete a featured game'
    },
    validation: {
        _user: {
            description: 'User',
            isRequired: true
        },
        game: {
            description: 'Game slug',
            isRequired: true
        }
    }
}, gameFeatured.delFeatured);

/*
 * game/genre
 */

var gameGenre = require('./views/game/genre');

// Sample usage:
// % curl 'http://localhost:5000/genre'
serverHTTP.get({
    url: '/genre',
    swagger: {
        nickname: 'genre',
        notes: 'Get the list of genres',
        summary: 'List of game genres'
    }
}, gameGenre.getGenreList);

// Sample usage:
// % curl -X POST 'http://localhost:5000/genre' -d 'name=Action&slug=action'
serverHTTP.post({
    url: '/genre',
    swagger: {
        nickname: 'add-genre',
        notes: 'Add a new game genre',
        summary: 'Add new game genre'
    },
    validation: {
        name: {
            description: 'Genre name',
            isRequired: true
        },
        slug: {
            description: 'Genre slug',
            isRequired: true
        }
    }
}, gameGenre.postNewGenre);

// Sample usage:
// % curl -X DELETE 'http://localhost:5000/genre' -d 'slug=action'
serverHTTP.del({
    url: '/genre',
    swagger: {
        nickname: 'delete-genre',
        notes: 'Remove an existing game genre',
        summary: 'Delete a game genre'
    },
    validation: {
        slug: {
            description: 'Genre slug',
            isRequired: true
        }
    }
}, gameGenre.delGenre);

/*
 * game/list
 */

var gameList = require('./views/game/list');

// Sample usage:
// % curl 'http://localhost:5000/game/list'
serverHTTP.get({
    url: '/game/list',
    swagger: {
        nickname: 'list',
        notes: 'List of games matching provided filter',
        summary: 'Game List'
    },
    validation: {
        _user: {
            description: 'User (ID or username slug)',
            isRequired: false  // Only required for restricted filters
        },
        count: {
            description: 'Maximum number of games to return',
            isRequired: false,
            isInt: true,
            min: 1,
            max: 100
        },
        status: {
            description: 'Filter by current status of the game',
            isRequired: false,
            isIn: ['approved', 'pending', 'rejected']
        }
    }
}, gameList.getGameList);

/*
 * game/moderate
 */

var gameModerate = require('./views/game/moderate');

// verb: status
// TODO: put this elsewhere so game/moderate.js can see it?
const STATUSES = {
    approve: 'approved',
    pending: 'pending',
    reject: 'rejected',
    disable: 'disabled',
    delete: 'deleted'
};

// Sample usage:
// % curl http://localhost:5000/game/mario-bros/approve'
// % curl http://localhost:5000/game/mario-bros/reject'
Object.keys(STATUSES).forEach(function (statusVerb) {
    serverHTTP.get({
        url: '/game/:slug/' + statusVerb,
        swagger: {
            nickname: statusVerb,
            notes: statusVerb.substr(0, 1).toUpperCase() + statusVerb.substr(1) + ' game',
            summary: 'Change the status of a game to ' + STATUSES[statusVerb]
        }
    }, gameModerate(STATUSES[statusVerb]));
});


/*
 * game/submit
 */

var gameSubmit = require('./views/game/submit');

// Sample usage:
// % curl -X POST 'http://localhost:5000/game/submit' -d 'name=Mario Bros&app_url=http://mariobro.se&icons=128&screenshots=yes'
serverHTTP.post({
    url: '/game/submit',
    swagger: {
        nickname: 'submit',
        notes: 'Submit game',
        summary: 'Submission'
    },
    validation: {
        app_url: {
            description: 'App URL',
            isRequired: true,
            isUrl: true
        },
        homepage_url: {
            description: 'Homepage URL',
            isRequired: false,
            isUrl: true
        },
        icons: {
            description: 'Icons',
            isRequired: true,
        },
        name: {
            description: 'Name',
            isRequired: true,
            max: 128
        },
        screenshots: {
            description: 'Screenshots',
            isRequired: true
        }
    }
}, gameSubmit.postSubmitGame);

/*
 * user/acl
 */

var userAcl = require('./views/user/acl');

// Sample usage:
// % curl -X POST 'http://localhost:5000/user/acl' -d 'id=1&dev=1&reviewer=1&admin=1'
// TODO: Make sure only admins can do this
serverHTTP.post({
    url: '/user/acl',
    validation: {
        _user: {
            description: "A user's SSA token",
            isRequired: true
        },
        id: {
            description: 'User ID to change permissions for',
            isRequired: true
        },
        dev: {
            description: 'Whether or not user should have developer permissions',
            isRequired: true,
            isIn: ['0', '1']
        },
        reviewer: {
            description: 'Whether or not user should have reviewer permissions',
            isRequired: true,
            isIn: ['0', '1']
        },
        admin: {
            description: 'Whether or not user should have admin permissions',
            isRequired: false,
            isIn: ['0', '1']
        }
    },
    swagger: {
        nickname: 'acl',
        notes: 'Update User Permissions',
        summary: 'ACL'
    }
}, userAcl.postAcl);

/*
 * user/friends
 */

var userFriends = require('./views/user/friends');

// Sample usage:
// % curl 'http://localhost:5000/user/friends?_user=ssatoken'
/*
Optional params:
?only={online|played|playedOnline|playing}
&game=<game>
*/
serverHTTP.get({
    url: '/user/friends',
    validation: {
        _user: {
            description: "A user's SSA token",
            isRequired: true
        }
    }
}, userFriends.getNonfriendsFromEmail);

// Sample usage:
// % curl -X POST 'http://localhost:5000/user/friends' -d '_user=ssatoken&recipient=uid'
serverHTTP.post({
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
}, userFriends.postFriendRequest);

serverHTTP.get({
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
}, userFriends.getFriendRequests);

serverHTTP.post({
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
}, userFriends.postAcceptFriendRequest);

serverHTTP.post({
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
}, userFriends.postIgnoreRequest);

serverHTTP.post({
    url: '/user/friends/unfriend',
    swagger: {
        nickname: 'unfriend-friend',
        notes: 'Unfriends a friend',
        summary: 'Unfriend friend'
    },
    validation: {
        _user: {
            description: 'A user\'s SSA token.',
            isRequired: true
        },
        exfriend: {
            description: 'The user ID of someone whom to the user wants to unfriend',
            isRequired: true
        }
    }
}, userFriends.postUnfriend);

/*
 * user/login
 */

var userLogin = require('./views/user/login');

// Sample usage:
// % curl -X POST 'http://localhost:5000/user/login' -d 'assertion=&audience'
serverHTTP.post({
    url: '/user/login',
    swagger: {
        nickname: 'login',
        notes: 'Sign in via Persona',
        summary: 'Login'
    }
}, userLogin.postLogin);

/*
 * user/purchase
 */

var userPurchase = require('./views/user/purchase');

// Sample usage:
// % curl -X POST 'http://localhost:5000/user/purchase' -d '_user=ssatoken&game=9'
serverHTTP.post({
    url: '/user/purchase',
    swagger: {
        nickname: 'purchase',
        notes: 'Record that a user has purchased this game',
        summary: 'Purchase game'
    },
    validation: {
        _user: {
            description: 'User (ID or username slug)',
            isRequired: true
        },
        game: {
            description: 'Game (ID or slug)',
            isRequired: true
        }
    }
}, userPurchase.postPurchaseGame);

/*
 * user/profile
 */

var userProfile = require('./views/user/profile');

// Sample usage:
// % curl -X PUT 'http://localhost:5000/user/profile?_user=ssatoken'
/*
Optional params (at least one must be provided to have any effect):
?username=new_name
&email=new_address
*/
serverHTTP.put({
    url: '/user/profile',
    swagger: {
        nickname: 'update-profile',
        notes: 'Update user profile',
        summary: 'Update user profile'
    },
    validation: {
        _user: {
            description: 'User (ID or username slug)',
            isRequired: true
        },
        email: {
            description: 'New user email',
            isEmail: true,
            isRequired: false,
        },
        username: {
            description: 'New username',
            isRequired: false,
        }
    }
}, userProfile.putUpdateProfile);

/*
 * user/search
 */

var userSearch = require('./views/user/search');

// Sample usage:
// % curl 'http://localhost:5000/user/search?_user=ssatoken'
serverHTTP.get({
    url: '/user/search',
    validation: {
        _user: {
            description: "A user's SSA token",
            isRequired: true
        },
        email: {
            description: 'Email to search for',
            isRequired: false
        },
        id: {
            description: 'User ID to search for',
            isRequired: false
        },
        devSlug: {
            description: 'Company Slug to search for',
            isRequired: false
        },
        q: {
            description: 'Email/user ID/username to search for',
            isRequired: false
        }
    }
}, userSearch.getUser);

/*
 * End of URL routing (phew)
 */

var serverName = serverHTTP.name;

serverHTTP.listen(process.env.PORT || 5000, function() {
    console.log('%s HTTP server listening at %s', serverName, serverHTTP.url);
    if (process.env.DB_PREFILL) {
        var client = db.redis();
        client.publish('galaxy-db-prefill:api', 'ready', function() {
            client.end();
        });
    }
});

serverWS.listen(function(url) {
    console.log('%s WebSocket server listening at %s', serverName, url);
});
