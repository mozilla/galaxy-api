# galaxy-api

Here lives the API that is consumed by the front-end interface for
[cvan/galaxy](cvan/galaxy).


## Installation

* `npm install`
* `cp settings_local.js.dist settings_local.js`
* `nodemon app.js`


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
