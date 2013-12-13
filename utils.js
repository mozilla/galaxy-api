var fs = require('fs');
var path = require('path');


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

module.exports.mkdirRecursive = mkdirRecursive;
module.exports.slugify = slugify;
