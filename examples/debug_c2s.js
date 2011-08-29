var xmpp = require('../lib/node-xmpp');

var cl = new xmpp.Client({ jid: "julien@localhost", password: "hello"});
cl.on('online', function() {
    console.log("ONLINE!!! YIHAA");
});