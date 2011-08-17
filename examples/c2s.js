var xmpp = require('../lib/node-xmpp');

var r = new xmpp.Router();
var c2s = new xmpp.C2S(r);
r.register('127.0.0.1', function(stanza) {
    console.log("<< "+stanza.toString());
    c2s.receive(stanza);
});
