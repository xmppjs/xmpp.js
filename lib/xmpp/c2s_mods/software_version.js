var xmpp = require('../../node-xmpp');

// XEP-0092: Software Version
exports.name = "mod_version";

// Required
exports.onRawStanza = function(stanza, client) {
    // Deal with the stanza!
    if (stanza.is('iq') && (query = stanza.getChild('query', "jabber:iq:version"))) {
        stanza.attrs.type = "result";
        stanza.attrs.to = stanza.attrs.from;
        delete stanza.attrs.from;
        
        // Actual version attributes
        if(typeof(exports.name) === "undefined") {
            query.c("name").t(exports.default.name);
        }
        else {
            query.c("name").t(exports.name);
        }
        
        if(typeof(exports.version) === "undefined") {
            query.c("version").t(exports.default.version);
        }
        else {
            query.c("version").t(exports.version);
        }
        
        if(typeof(exports.os) === "undefined") {
            query.c("os").t(exports.default.os);
        }
        else {
            query.c("os").t(exports.os);
        }
        
        client.send(stanza);
    }
}


exports.default = {
    name: "node-xmpp Server",
    version: "1.3.3.7",
    os: "earth OS"
};

