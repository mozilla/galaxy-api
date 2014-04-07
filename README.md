# galaxy-api

[![Stories in Ready](https://badge.waffle.io/cvan/galaxy-api.png?label=ready&title=Ready)](https://waffle.io/cvan/galaxy-api)

Here lives the API that is consumed by the front-end interface for
[cvan/galaxy](https://github.com/cvan/galaxy).


## Installation

```bash
# Install redis via homebrew
brew install redis
# Install node dependencies
npm install
# Copy local configuration into place
cp settings_local.js.dist settings_local.js
# Start the server
npm start
```

If you'd like to run the server for development, consider using `nodemon` instead:

```bash
npm install nodemon -g
nodemon app.js
```


## Deployment

We use stackato:

    stackato push --no-prompt

To start the instance on stackato:

    stackato start

To read the logs on stackato:

    stackato logs

To run shell commands on stackato:

    stackato run cat ../logs/stdout.log

To access the shell on stackato:

    stackato ssh


## Sample Usage

### Game Submission
    curl -X POST 'http://localhost:5000/game/submit?_user=ssa_token' -H 'Content-Type:application/json' -H 'Accept: application/json' -d '{"app_url":"http://nuttyninjas.com/","artwork":{"background":"background.jpg"},"description":"Nutty Ninjas is a real-time shooter that brings the experience of social multiplayer gaming to a whole new level; it is a console-style game that can be played anywhere and anytime, simply with your computer and mobile devices. Multiple players can join a common gameplay screen just by using their mobile devices, and control their ninja character to unleash dangerous weapons at fellow players!","developer":{"name":"Yang Shun","url":"http://yangshun.im/"},"genre":"action","homepage_url":"http://www.nuttyninjas.com","icons":"http://png-4.findicons.com/files/icons/2297/super_mario/256/paper_mario.png","name":"Nutty Ninjas","privacy_policy_url":"http://una-org.github.io/demos.html","screenshots":["http://www.digitaltrends.com/wp-content/uploads/2011/02/nintendo-new-super-mario-bros-ds-art-screenshot.jpg","http://splitkick.com/wp-content/uploads/2013/01/newsuper2img.jpg","http://www.mariowiki.com/images/f/fc/SuperMarioBrosArtwork2.jpg","http://www.digitaltrends.com/wp-content/uploads/2011/02/nintendo-new-super-mario-bros-ds-art-screenshot.jpg","http://splitkick.com/wp-content/uploads/2013/01/newsuper2img.jpg","http://www.mariowiki.com/images/f/fc/SuperMarioBrosArtwork2.jpg","http://www.digitaltrends.com/wp-content/uploads/2011/02/nintendo-new-super-mario-bros-ds-art-screenshot.jpg","http://splitkick.com/wp-content/uploads/2013/01/newsuper2img.jpg","http://www.mariowiki.com/images/f/fc/SuperMarioBrosArtwork2.jpg"],"slug":"nutty-ninjas","videos":["http://www.youtube.com/embed/4kvT0dywaF8","http://www.youtube.com/embed/1Sow2O8D9Ok"]}'

### Game Details

    curl 'http://localhost:5000/game/nutty-ninjas/detail'

### Grant a user admin privileges

    ./scripts/addusertogroup.js cvan@mozilla.com admin

### Grant a user admin+reviewer privileges

    ./scripts/addusertogroup.js cvan@mozilla.com admin reviewer

### Revoke a user's admin privileges

    ./scripts/removeuserfromgroup.js cvan@mozilla.com admin

### Revoke a user's admin+reviewer privileges

    ./scripts/removeuserfromgroup.js cvan@mozilla.com admin reviewer

### Using prefilled data

    ./scripts/db-prefill.js

To flush the db everytime the script is run, add the following to `settings_local.js`:
    `exports.FLUSH_DB_ON_PREFILL = true;`

### Running unit tests

    cp settings_test.js.dist settings_test.js
    ./test/redis_start
    make test