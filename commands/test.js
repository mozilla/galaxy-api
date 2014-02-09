var db = require('../db');
var client = db.redis();
console.log(client.set('d', 'd'))