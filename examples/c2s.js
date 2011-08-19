var xmpp = require('../lib/node-xmpp');

var c2s = new xmpp.C2S({
    port: 5222, 
    host: '127.0.0.1',
    domain: '127.0.0.1'
});

c2s.on("stanza", function(stanza, client) {
    // No roster support in this server!
    if (stanza.is('iq') && stanza.attrs.type == 'get' && (session = stanza.getChild('query', 'jabber:iq:roster'))) {
        client.send(new xmpp.Element("iq", {type:"error", id: stanza.attrs.id}).c("query", { xmlns: "jabber:iq:roster"})); 
    }
})


