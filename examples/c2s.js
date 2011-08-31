var xmpp = require('../lib/node-xmpp');

/* This is a very basic C2S example. One of the key design decisions of node-xmpp is to keep it very lightweight */
/* If you need a full blown server check out https://github.com/superfeedr/node-xmpp-c2s */

// Sets up the server.
var c2s = new xmpp.C2S({
    port: 5222, 
    domain: 'localhost'//,
    // tls: {
    //     keyPath: './examples/localhost-key.pem',
    //     certPath: './examples/localhost-cert.pem'
    // }
    
});

// Allows the developer to authenticate users against anything they want.
c2s.on("authenticate", function(jid, password, client, cb) {
    cb(true); // cb(false);
});

// Allows the developer to register the jid against anything they want
c2s.on("register", function(jid, password, client, cb) {
    cb(true); // cb(false, {code: "406", type: "modify", text: "not-acceptable"}); 
});

// On Connect event. When a client connects.
c2s.on("connect", function(client) {
    // That's the way you add mods to a given server.
});

// On Disconnect event. When a client disconnects
c2s.on("disconnect", function(client) {
});

// Most imoortant pieces of code : that is where you can configure your XMPP server to support only what you care about/need.
c2s.on("stanza", function(stanza, client) {

});