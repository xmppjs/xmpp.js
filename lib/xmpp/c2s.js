var EventEmitter = require('events').EventEmitter;
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
*   options : port on which to listen to C2S connections */
function C2S(options) {
    var self = this;
    this.sessions = {}; // We may actually want to store sessions somewhere else than in memory (like Redis to support clustering.)
    this.options = options;

    // And now start listening to connections on the port provided as an option.
    net.createServer(function (inStream) {
        self.acceptConnection(inStream, options);
    }).listen(options.port, options.host);

    // Sets up a router for S2S.
    self.router = new router.Router();
    
    if(options.tls) {
        self.router.loadCredentials(options.domain, options.tls.keyPath, options.tls.certPath);
    }

    // Called when a stanza was received to be routed.
    self.router.register(options.domain, function(stanza) {
        self.route(stanza);
    });
}

sys.inherits(C2S, EventEmitter);
exports.C2S = C2S;

/**
* Called upon TCP connection from client. */
C2S.prototype.acceptConnection = function(socket, options) {
    var client = new C2SClient(socket, this);
    this.emit("connect", client);
    socket.addListener('error', function() { });
    client.addListener('error', function() { });
}

/**
* C2S Router */
C2S.prototype.route = function(stanza) {
    var self = this;
    if(stanza.attrs && stanza.attrs.to) {
        var toJid = new JID(stanza.attrs.to);
        if(self.sessions.hasOwnProperty(toJid.bare().toString())) {
            // Now loop over all the sesssions and only send to the right jid(s)
            for(var resource in self.sessions[toJid.bare().toString()]) {
                if(toJid.bare().toString() === stanza.attrs.to || toJid.resource === resource) {
                    self.sessions[toJid.bare().toString()][resource].send(stanza);
                }
            }
        }
    }
    else {
        // Huh? Who is it for? and why did it end up here?
    }
}

/**
 * Registers a route (jid => specific client connection)
 */
C2S.prototype.registerRoute = function(jid, client) {
    // What if we have a conflict! TOFIX
    if(!this.sessions.hasOwnProperty(jid.bare().toString()))
        this.sessions[jid.bare().toString()] = {}; 
    this.sessions[jid.bare().toString()][jid.resource] = client;
    return true;
}

/**
 * Unregisters a route (jid => specific client connection)
 */
C2S.prototype.unregisterRoute = function(jid, client) {
    if(!this.sessions.hasOwnProperty(jid.bare().toString())) {
        // Hum. What? That can't be.
    } else {
        delete this.sessions[jid.bare().toString()][jid.resource];
    }
    return true;
}


function C2SClient(socket, c2s) {
    var self = this;
    this.authentified = false;
    this.c2s = c2s;
    Connection.Connection.call(this, socket);

    this.xmlns[''] = NS_CLIENT;
    this.xmppVersion = '1.0';
    this.credentials = this.c2s.router.credentials[this.c2s.options.domain];
    
    this.startParser();

    this.addListener('streamStart', function(streamAttrs) {
        self.startStream(streamAttrs);
    });

    this.addListener('rawStanza', function(stanza) {
        self.onRawStanza(stanza);
    });
    
    this.addListener('auth-success', function(jid) {
        self.jid = jid;
        self.authentified = true;
        self.stopParser();
        self.send(new ltx.Element("success", { xmlns: NS_XMPP_SASL }));
        self.startParser();
    });

    this.addListener('auth-fail', function(jid) {
        self.send(new ltx.Element("failure", { xmlns: NS_XMPP_SASL }));
    });
    
    this.addListener('close', function() {
        self.c2s.emit("disconnect", self); 
        self.c2s.unregisterRoute(self.jid, self); // We need to remove this user's connections!
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

    attrs.from = this.c2s.options.domain;

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
        // TLS
        if(this.c2s.options.tls) {
            features.c("starttls", {xmlns: NS_XMPP_TLS}).c("required")
        }
        this.mechanisms = sasl.availableMechanisms();
        
        var mechanisms = features.c("mechanisms", { xmlns: NS_XMPP_SASL});
        for(var i in this.mechanisms) {
            mechanisms.c("mechanism").t(this.mechanisms[i].name); // We allow DIGEST-MD5.
        }
    }
    else {
        features.c("bind", {xmlns: 'urn:ietf:params:xml:ns:xmpp-bind'});
        features.c("session", {xmlns: 'urn:ietf:params:xml:ns:xmpp-session'});
    }
    this.send(features);
}

C2SClient.prototype.onRawStanza = function(stanza) {
    var bind, session;

    if(this.jid) {
        stanza.attrs.from = this.jid.toString();
    }
    
    if(stanza.is('starttls', NS_XMPP_TLS)) {
        this.send(new ltx.Element('proceed', { xmlns: Connection.NS_XMPP_TLS }));
        this.setSecure(this.c2s.options.tls, true);
    }
    else if(stanza.is('auth', NS_XMPP_SASL)) {
        this.onAuth(stanza);
    }
    else if (stanza.is('iq') &&
	     stanza.attrs.type == 'set' &&
	     (bind = stanza.getChild('bind', 'urn:ietf:params:xml:ns:xmpp-bind'))) {
        this.onBind(stanza);
    }
    else if (stanza.is('iq') &&
	     stanza.attrs.type == 'set' &&
	     (session = stanza.getChild('session', 'urn:ietf:params:xml:ns:xmpp-session'))) {
        this.onSession(stanza);
    }
    else if (stanza.attrs.to &&
	     stanza.attrs.to != "" &&
	     stanza.attrs.to != this.c2s.options.domain &&
	     stanza.attrs.to != this.jid.bare().toString()) {
        this.c2s.router.send(stanza);
    }
    else {
        // Let's trigger self for Mixins
        this.emit('stanza', stanza, this);
        // Then send it to the user code, just in case the user wants to interract with it.
        this.c2s.emit('stanza', stanza, this);
    }
}

C2SClient.prototype.authenticate = function(username, password) {
    this.c2s.emit('authenticate', new JID(username, this.c2s.options.domain), password, this);
}

C2SClient.prototype.onAuth = function(stanza) {
    var self = this;
    for(var i in this.mechanisms) {
        if(stanza.attrs.mechanism == this.mechanisms[i].name) {
            this.mechanism =  this.mechanisms[i];
            this.mechanism.authServer(decode64(stanza.getText()), this);
            break;
        }
        else {
            self.send(new ltx.Element("failure", { xmlns: NS_XMPP_SASL })); // We're doomed. Not right auth mechanism offered.
        }
    }
}

C2SClient.prototype.onBind = function(stanza) {
    var self = this;
    var bind = stanza.getChild('bind', 'urn:ietf:params:xml:ns:xmpp-bind')
    if(resource = bind.getChild("resource", 'urn:ietf:params:xml:ns:xmpp-bind')) {
        self.jid.setResource(resource.getText());
    }
    else {
        self.jid.setResource(generateId());
    }
    if(self.c2s.registerRoute(self.jid, self)) {
        self.send(new ltx.Element("iq", {type:"result", id: stanza.attrs.id}).c("bind", { xmlns: "urn:ietf:params:xml:ns:xmpp-bind"}).c("jid").t(self.jid.toString()));
    }
}

C2SClient.prototype.onSession = function(stanza) {
    var self = this;
    self.send(new ltx.Element("iq", {type:"result", id: stanza.attrs.id}).c("session", { xmlns: "urn:ietf:params:xml:ns:xmpp-session"})); 
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


