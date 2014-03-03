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

    curl -X POST 'http://localhost:5000/game/submit' -d 'name=Mario Bros&app_url=http://mariobro.se&icons=128&screenshots=yes&videos=yes'

### Game Details

    curl 'http://localhost:5000/game/mario-bros/detail'
