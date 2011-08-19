var Connection = require('./connection');
var JID = require('./jid').JID;
var ltx = require('ltx');
var sys = require('sys');
var crypto = require('crypto');
var SRV = require('./srv');
var net = require('net');
var sasl = require('./sasl');
var router = require('./router');

var NS_CLIENT = 'jabber:client';
var NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl';
var NS_XMPP_TLS  = 'urn:ietf:params:xml:ns:xmpp-tls';

/**
* params:
*   options : port on which to listen to C2S connections
*/
function C2S(options) {
    // And now start listening to connections on the port provided as an option.
    var self = this;
    this.sessions = {}; // We may actually want to store sessions somewhere else than in memory!
    this.options = options;
    
    net.createServer(function(inStream) {
        self.acceptConnection(inStream, options);
    }).listen(options.port, options.host);
    
    // Sets up a router for S2S.
    self.router = new router.Router();

    // Registering stuff.
    self.router.register(options.domain, function(stanza) {
        console.log("<< "+stanza.toString());
        // Called when a stanza was received from 'outside'.
    });
}

sys.inherits(C2S, Connection.Connection);
exports.C2S = C2S;

/**
* Incoming stanzas... 
*/
C2S.prototype.receive = function(stanza) {
};

/**
* Called upon TCP connection from client.
*/
C2S.prototype.acceptConnection = function(socket, options) {
    var client = new C2SClient(socket, this);
    socket.addListener('error', function() { });
    client.addListener('error', function() { });
}

function C2SClient(socket, c2s) {
    var self = this;
    this.authentified = false;
    this.c2s = c2s;
    Connection.Connection.call(this, socket);
    
    this.xmlns[''] = NS_CLIENT;
    this.xmppVersion = '1.0';

    this.startParser();
    
    this.addListener('streamStart', function(streamAttrs) {
        self.startStream(streamAttrs);
    });

    this.addListener('rawStanza', function(stanza) {
        var self = this;
        
        if(stanza.is('auth', NS_XMPP_SASL)) {
            for(var i in this.mechanisms) {
                if(stanza.attrs.mechanism == this.mechanisms[i].name) {
                    this.mechanism =  this.mechanisms[i];
                    this.mechanism.addListener("success", function() {
                        self.bareJid = self.mechanism.username + "@" + self.c2s.options.domain;
                        self.authentified = true;
                        self.stopParser();
                        self.send(new ltx.Element("success", { xmlns: NS_XMPP_SASL }));
                        self.startParser();
                    });
                    this.mechanism.addListener("failed", function() {
                        self.send(new ltx.Element("failure", { xmlns: NS_XMPP_SASL }));
                    });
                    this.mechanism.addListener("challenge", function(challenge) {
                        self.send(new ltx.Element("challenge", {xmlns: NS_XMPP_SASL}).t(encode64(challenge)));
                    })
                    this.mechanism.authServer(decode64(stanza.getText()));
                    break;
                }
                else {
                    self.send(new ltx.Element("failure", { xmlns: NS_XMPP_SASL })); // We're doomed. Not right auth mechanism offered.
                }
            }
        }
        else if (stanza.is('iq') &&
            stanza.attrs.type == 'set' &&
            (bind = stanza.getChild('bind', 'urn:ietf:params:xml:ns:xmpp-bind'))) {
                if(resource = bind.getChild("resource", 'urn:ietf:params:xml:ns:xmpp-bind')) {
                    self.fullJid = this.bareJid + "/" + resource.getText();
                }
                else {
                    self.fullJid = this.bareJid + "/" + generateId();
                }
                if(self.c2s.sessions[self.fullJid]) {
                    // We have a conflict! TOFIX
                }
                self.c2s.sessions[self.fullJid] = self;
                self.send(new ltx.Element("iq", {type:"result", id: stanza.attrs.id}).c("bind", { xmlns: "urn:ietf:params:xml:ns:xmpp-bind"}).c("jid").t(self.fullJid)); 
        }
        else if (stanza.is('iq') && 
            stanza.attrs.type == 'set' &&
            (session = stanza.getChild('session', 'urn:ietf:params:xml:ns:xmpp-session'))) {
                self.send(new ltx.Element("iq", {type:"result", id: stanza.attrs.id}).c("session", { xmlns: "urn:ietf:params:xml:ns:xmpp-session"})); 
        }
        else {
            this.c2s.emit('stanza', stanza, this);
        }
    });

    return self;
};
sys.inherits(C2SClient, Connection.Connection);

C2SClient.prototype.startStream = function(streamAttrs) {
    var attrs = {};
    for(var k in this.xmlns) {
        if (this.xmlns.hasOwnProperty(k)) {
            if (!k)
                attrs.xmlns = this.xmlns[k];
            else
                attrs['xmlns:' + k] = this.xmlns[k];
        }
    }
    if (this.xmppVersion)
        attrs.version = this.xmppVersion;
    if (this.streamTo)
        attrs.to = this.streamTo;

    this.streamId = generateId();
    
    attrs.id = this.streamId;

    attrs.from = "127.0.0.1";
    
    var el = new ltx.Element('stream:stream', attrs);
    // make it non-empty to cut the closing tag
    el.t(' ');
    var s = el.toString();
    this.send(s.substr(0, s.indexOf(' </stream:stream>')));

    this.setFeatures();
} 

C2SClient.prototype.setFeatures = function() {
    var features = new ltx.Element('stream:features');
    if(!this.authentified) {
        this.mechanisms = sasl.availableMechanisms();

        var mechanisms = features.c("mechanisms", { xmlns: NS_XMPP_SASL});
        for(var i in this.mechanisms) {
            mechanisms.c("mechanism").t(this.mechanisms[i].name); // We allow DIGEST-MD5.
        }
    }
    else {
        // <bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'/>
        // <session xmlns='urn:ietf:params:xml:ns:xmpp-session'/>
        features.c("bind", {xmlns: 'urn:ietf:params:xml:ns:xmpp-bind'});
        features.c("session", {xmlns: 'urn:ietf:params:xml:ns:xmpp-session'});
    }
    this.send(features);
}

C2SClient.prototype.challenge = function(stanza) {
    if(stanza.getText()) {
        return encode64(this.mechanism.serverChallenge(decode64(stanza.getText())));
    }
    else {
        return encode64(this.mechanism.serverChallenge());
    }
}

C2SClient.prototype.auth = function(response) {
    if(this.mechanism.response(decode64(response))) {
        if(this.mechanism.response != this.mechanism.responseValue(decode64(response))) {
            // Failed auth...
            this.send(new ltx.Element('failure', {xmlns: 'urn:ietf:params:xml:ns:xmpp-sasl'}));
        }
        else {
            // Success!
        }
    }
    else {
        this.send(new ltx.Element('failure', {xmlns: 'urn:ietf:params:xml:ns:xmpp-sasl'}));
    }
}


function generateId() {
    var r = new Buffer(16);
    for(var i = 0; i < r.length; i++) {
        r[i] = 48 + Math.floor(Math.random() * 10);  // '0'..'9'
    }
    return r.toString();
};
function decode64(encoded) {
    return (new Buffer(encoded, 'base64')).toString('utf8');
}
function encode64(decoded) {
    return (new Buffer(decoded, 'utf8')).toString('base64');
}


