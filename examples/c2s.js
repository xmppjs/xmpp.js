var xmpp = require('../lib/node-xmpp');

var r   = new xmpp.Router();
var c2s = new xmpp.C2S(r, {
    port: 5222, 
    host: '127.0.0.1'
});

// Called when a stanza was received from a local client.
c2s.on("stanza", function(stanza, client) {
    console.log(stanza);
})

// Registering stuff.
r.register('127.0.0.1', function(stanza) {
    console.log("<< "+stanza.toString());
    c2s.receive(stanza); // Called when a stanza was received from 'outside'.
});

