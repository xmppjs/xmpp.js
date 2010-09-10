var xmpp = require('../lib/node-xmpp');

var r = new xmpp.Router();
r.register('codetu.be', function(stanza) {
    console.log("<< "+stanza.toString());
    if (stanza.attrs.type !== 'error') {
	var me = stanza.attrs.to;
	stanza.attrs.to = stanza.attrs.from;
	stanza.attrs.from = me;
	r.send(stanza);
    }
});
