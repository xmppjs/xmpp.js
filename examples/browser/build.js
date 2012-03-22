var browserify = require('browserify');
var path = require('path');
var b = browserify({
    debug: true,
    cache: false
});
var root = path.join(__dirname, "..", "..");
b.require("./lib/node-xmpp-browserify.js",
    { root: root, basedir: root });
b.include("node-xmpp", "/node_modules/node-xmpp", "module.exports = require('/lib/node-xmpp-browserify.js');");
b.addEntry('chat.js');

var fs = require('fs');

fs.writeFileSync('index.js', b.bundle());
