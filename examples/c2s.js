var xmpp = require('../lib/node-xmpp');

/*
 *  TODO
 *  - support for Presence
 *  - Support for TLS
 *  - Support for customized auth.
 *  - Cluster with Redis PubSub.
 *  - Admin tools
 *  - Component interface
 *  - Plugins for 'well-known' services (Roster, PubSub, PEP)
 *  - Logging
 *  - Shapers
 *  - In-band registration
 *  - mods :
 *      - offline
 *      - announce
 *      - caps
 *      - muc
 *      - 
 */

// Sets up the server.
var c2s = new xmpp.C2S({
    port: 5222, 
    domain: 'zipline.local',
    // tls: {
    //     keyPath: './examples/zipline.local.pem',
    //     certPath: './examples/zipline.local.certificate.pem',
    // }
});

// Allows the developer to authenticate users against anything they want.
c2s.on("authenticate", function(jid, password, client) {
    if(jid.user == "julien" && password == "hello") {
        client.emit("auth-success", jid); 
    }
    else {
        client.emit("auth-fail", jid);
    }
});

// Most imoortant pieces of code : that is where you can configure your XMPP server to support only what you care about/need.
c2s.on("stanza", function(stanza, client) {
    var query, vCard;
    // We should provide a bunch of "plugins" for the functionalities below.
    
    // No roster support in this server!
    if (stanza.is('iq') && (session = stanza.getChild('query', 'jabber:iq:roster'))) {
        stanza.attrs.type = "error";
        stanza.attrs.to = stanza.attrs.from;
        delete stanza.attrs.from;
        client.send(stanza);
    }
    // No private support on this server
    else if (stanza.is('iq') && (query = stanza.getChild('query', "jabber:iq:private"))) {
        stanza.attrs.type = "error";
        stanza.attrs.to = stanza.attrs.from;
        delete stanza.attrs.from;
        client.send(stanza);
    }
    // No vCard support on this server.
    else if (stanza.is('iq') && (vCard = stanza.getChild('vCard', "vcard-temp"))) {
        stanza.attrs.type = "error";
        stanza.attrs.to = stanza.attrs.from;
        delete stanza.attrs.from;
        client.send(stanza);
    }
    // No DiscoInfo on this server.
    else if (stanza.is('iq') && (query = stanza.getChild('query', "http://jabber.org/protocol/disco#info"))) {
        stanza.attrs.type = "error";
        stanza.attrs.to = stanza.attrs.from;
        delete stanza.attrs.from;
        client.send(stanza);
    }
    // No Version support on this server.
    else if (stanza.is('iq') && (query = stanza.getChild('query', "jabber:iq:version"))) {
        stanza.attrs.type = "error";
        stanza.attrs.to = stanza.attrs.from;
        delete stanza.attrs.from;
        client.send(stanza);
    }
    else {
        console.log("---")
        console.log("YOUR SERVER MAYBE NEEDS TO SUPPORT THIS FEATURE?");
        console.log(stanza)
    }
})


