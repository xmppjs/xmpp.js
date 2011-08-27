var xmpp = require('../lib/node-xmpp');
var SoftwareVersion = require('./c2s_mods/software_version'); 

/*
 *  TODO
 *  - support for Presence module
 *  - Support for TLS () : https://groups.google.com/group/nodejs/browse_thread/thread/1e8e6501493d63b8#
 *  - Admin tools 
 *  - Component interface 
 *  - Plugins for 'well-known' services (Roster, PubSub, PEP)
 *  - Logging
 *  - Shapers
 *  - In-band registration
 *  - mods :
 *      - presence
 *      - offline
 *      - announce
 *      - caps
 *      - muc
 *      - roster
 *      - PEP
 */

// Sets up the server.
var c2s = new xmpp.C2S({
    port: 5222, 
    domain: 'localhost',
    tls: {
        keyPath: './examples/localhost-key.pem',
        certPath: './examples/localhost-cert.pem'
    }
});

// Allows the developer to authenticate users against anything they want.
c2s.on("authenticate", function(jid, password, client) {
    if(password == "password") {
        client.emit("auth-success", jid); 
    }
    else {
        client.emit("auth-fail", jid);
    }
});

// On Connect event. When a client connects.
c2s.on("connect", function(client) {
    // That's the way you add mods to a given server.
    SoftwareVersion.name = "Node XMPP server example";
    SoftwareVersion.version = "0.0.0.1";
    SoftwareVersion.os = "Mac OS X 10.7 Lion";
    client.addMixin(SoftwareVersion.mod);
});

// On Disconnect event. When a client disconnects
c2s.on("disconnect", function(client) {
    
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
    else {
        
    }
})



// You can also decide to rewrite many things, like for example the way you route stanzas.
// This will allow for clustering for your node-xmpp server, using redis's PubSub feature.
// To run this example in its full "power", just run node exmaple c2s.js from 2 different machines, as long as they share the redis server, they should be able to communicate!
// var sys = require("sys");
// var redis = require("redis-node");
// var redispub = redis.createClient();   
// var redissub = redis.createClient();   
// 
// xmpp.C2S.prototype.route = function(stanza) {
//     var self = this;
//     if(stanza.attrs && stanza.attrs.to) {
//         var toJid = new xmpp.JID(stanza.attrs.to);
//         redispub.publish(toJid.bare().toString(), stanza.toString());
//     }
// }
// xmpp.C2S.prototype.registerRoute = function(jid, client) {
//     redissub.subscribeTo(jid.bare().toString(), function(channel, stanza, pattern) {
//         client.send(stanza);
//     });
//     return true;
// }
