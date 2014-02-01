# galaxy-api

Here lives the API that is consumed by the front-end interface for
[cvan/galaxy](cvan/galaxy).


## Installation

```bash
# Install dependencies
npm install
# Copy local configuration into place
cp settings_local.js.dist settings_local.js
# Start the server
npm start
```

If you'd like to run the server for development, consider using `nodemon` instead:

```bash
nodemon app.js
```

Make sure you have [redis](http://redis.io/topics/quickstart) installed and running before starting the server. 
Install using `brew install redis` (OS X) or `apt-get install redis-server`, then run using `redis-server`.

## Sample Usage

### Game Submission

    curl -X POST 'http://localhost:5000/game/submit' -d 'name=Mario Bros&app_url=http://mariobro.se&icons=128&screenshots=yes'

### Game Details

    curl 'http://localhost:5000/game/mario-bros/detail'

### Webapp

#### Manifest JSON (Firefox)

    curl 'http://localhost:5000/game/mario-bros/manifest'

#### Manifest Launcher

    curl 'http://localhost:5000/launch.html?https://mariobro.se'
