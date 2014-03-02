# galaxy-api

[![Stories in Ready](https://badge.waffle.io/cvan/galaxy-api.png?label=ready&title=Ready)](https://waffle.io/cvan/galaxy-api)

Here lives the API that is consumed by the front-end interface for
[cvan/galaxy](cvan/galaxy).


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


## Sample Usage

### Game Submission

    curl -X POST 'http://localhost:5000/game/submit' -d 'name=Nutty Ninjas&app_url=http://nuttyninjas.com/&icons=http://png-4.findicons.com/files/icons/2297/super_mario/256/paper_mario.png&videos=%5B%22http://www.youtube.com/embed/4kvT0dywaF8%22,%22http://www.youtube.com/embed/1Sow2O8D9Ok%22%5D&screenshots=%5B%22http://www.digitaltrends.com/wp-content/uploads/2011/02/nintendo-new-super-mario-bros-ds-art-screenshot.jpg%22,%22http://splitkick.com/wp-content/uploads/2013/01/newsuper2img.jpg%22,%22http://www.mariowiki.com/images/f/fc/SuperMarioBrosArtwork2.jpg%22,%22http://www.digitaltrends.com/wp-content/uploads/2011/02/nintendo-new-super-mario-bros-ds-art-screenshot.jpg%22,%22http://splitkick.com/wp-content/uploads/2013/01/newsuper2img.jpg%22,%22http://www.mariowiki.com/images/f/fc/SuperMarioBrosArtwork2.jpg%22,%22http://www.digitaltrends.com/wp-content/uploads/2011/02/nintendo-new-super-mario-bros-ds-art-screenshot.jpg%22,%22http://splitkick.com/wp-content/uploads/2013/01/newsuper2img.jpg%22,%22http://www.mariowiki.com/images/f/fc/SuperMarioBrosArtwork2.jpg%22%5D&artwork_background=background.jpg&developer_name=Yang Shun&developer_url=http://yangshun.im/&description=Nutty+Ninjas+is+a+real-time+shooter+that+brings+the+experience+of+social+multiplayer+gaming+to+a+whole+new+level%3B+it+is+a+console-style+game+that+can+be+played+anywhere+and+anytime%2C+simply+with+your+computer+and+mobile+devices.+Multiple+players+can+join+a+common+gameplay+screen+just+by+using+their+mobile+devices%2C+and+control+their+ninja+character+to+unleash+dangerous+weapons+at+fellow+players!&genre=action&privacy_policy_url=http://una-org.github.io/demos.html'

### Game Details

    curl 'http://localhost:5000/game/nutty-ninjas/detail'
