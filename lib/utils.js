var fs = require('fs');
var path = require('path');
var Promise = require('es6-promise').Promise;

function mkdirRecursive(dir) {
    var parent = path.resolve(dir, '../');
    if (!fs.existsSync(parent)) {
        mkdirRecursive(parent);
    }
    fs.mkdirSync(dir);
}

function slugify(text) {
    if (typeof text !== 'string') {
        return text;
    }
    return text.toString().toLowerCase()
               .replace(/\s+/g, '-')           // Replace spaces with -
               .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
               .replace(/\-\-+/g, '-')         // Replace multiple - with single -
               .replace(/^-+/, '')             // Trim - from start of text
               .replace(/-+$/, '');            // Trim - from end of text
}

function now() {
    // Returns a UNIX timestamp.
    return Math.floor((new Date()).getTime() / 1000);
}

/* Equivalent to Promise.all(), but with a dictionary instead of an array, 
 * Expects: a dictionary of promises
 * Returns: a dictionary of responses for each of those promises*/
function promiseMap(map) {
    var keys = Object.keys(map);
    var promises = keys.map(function(v) { return map[v]; });
    return Promise.all(promises).then(function(results){
        var mappedResults = {};
        keys.forEach(function(k, i){
            mappedResults[k] = results[i];
        });
        return mappedResults;
    });
}

module.exports.mkdirRecursive = mkdirRecursive;
module.exports.slugify = slugify;
module.exports.now = now;
module.exports.promiseMap = promiseMap;