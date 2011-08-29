var xmpp = require('../lib/node-xmpp');

var cl = new xmpp.Client({ jid: "julien@localhost", password: "password"});
cl.on('online', function() {
    console.log("ONLINE!!! YIHAA");
});

