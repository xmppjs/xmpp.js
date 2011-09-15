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
var fs = require('fs');

var NS_CLIENT = 'jabber:client';
var NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl';
var NS_XMPP_TLS  = 'urn:ietf:params:xml:ns:xmpp-tls';
var NS_REGISTER = 'jabber:iq:register';

/**
* params:
*   options : port on which to listen to C2S connections */
function C2SServer(options) {
    var self = this;
    this.sessions = {}; // We may actually want to store sessions somewhere else than in memory (like Redis to support clustering.)
    this.options = options;

    // And now start listening to connections on the port provided as an option.
    net.createServer(function (inStream) {
        self.acceptConnection(inStream, options);
    }).listen(options.port);

    // Load TLS key material
    if (options.tls) {
        this.credentials = { key: fs.readFileSync(options.tls.keyPath, 'ascii'), cert: fs.readFileSync(options.tls.certPath, 'ascii')};
    }

    // Sets up a router for S2S.
    self.router = new router.Router();

    // Called when a stanza was received to be routed.
    self.router.register(options.domain, function(stanza) {
        self.route(stanza);
    });
}

sys.inherits(C2SServer, EventEmitter);
exports.C2SServer = C2SServer;

/**
* Called upon TCP connection from client. */
C2SServer.prototype.acceptConnection = function(socket, options) {
    var client = new C2SStream(socket, this);
    this.emit("connect", client);
    socket.addListener('error', function() { });
    client.addListener('error', function() { });
};

/**
* C2S Router */
C2SServer.prototype.route = function(stanza) {
    var self = this;
    if (stanza.attrs && stanza.attrs.to) {
        var toJid = new JID(stanza.attrs.to);
        if (self.sessions.hasOwnProperty(toJid.bare().toString())) {
            // Now loop over all the sesssions and only send to the right jid(s)
            var sent = false, resource;
            for(resource in self.sessions[toJid.bare().toString()]) {
                if (toJid.bare().toString() === toJid.toString() || toJid.resource === resource) {
                    sent = true;
                    self.sessions[toJid.bare().toString()][resource].send(stanza);
                }
            }
            // We couldn't find a connected jid that matches the destination. Let's send it to everyone
            if (!sent) {
                for(resource in self.sessions[toJid.bare().toString()]) {
                    self.sessions[toJid.bare().toString()][resource].send(stanza);
                }
            }
        }
    }
    else {
        // Huh? Who is it for? and why did it end up here?
	// TODO: reply with error
    }
};

/**
 * Registers a route (jid => specific client connection)
 */
C2SServer.prototype.registerRoute = function(jid, client) {
    // What if we have a conflict! TOFIX
    if (!this.sessions.hasOwnProperty(jid.bare().toString()))
        this.sessions[jid.bare().toString()] = {};
    this.sessions[jid.bare().toString()][jid.resource] = client;
    return true;
};

/**
 * Returns the list of jids connected for a specific jid.
 */
C2SServer.prototype.connectedClientsForJid = function(jid) {
    jid = new JID(jid);
    if (!this.sessions.hasOwnProperty(jid.bare().toString())) {
        return [];
    }
    else {
        var jids = [];
        for(var resource in this.sessions[jid.bare().toString()]) {
            jids.push(new JID(jid.bare().toString() + "/" + resource));
        }
        return jids;
    }
};

/**
 * Unregisters a route (jid => specific client connection)
 */
C2SServer.prototype.unregisterRoute = function(jid, client) {
    if (!this.sessions.hasOwnProperty(jid.bare().toString())) {
        // Hum. What? That can't be.
    } else {
        delete this.sessions[jid.bare().toString()][jid.resource];
    }
    return true;
};


function C2SStream(socket, server) {
    var self = this;
    this.authenticated = false;
    this.server = server;
    Connection.Connection.call(this, socket);

    this.xmlns[''] = NS_CLIENT;
    this.xmppVersion = '1.0';

    this.startParser();

    this.addListener('streamStart', function(streamAttrs) {
        self.startStream(streamAttrs);
    });

    this.addListener('rawStanza', function(stanza) {
        self.onRawStanza(stanza);
    });

    this.addListener('close', function() {
        // We need to remove this user's connection, if authed:
        if (self.jid) {
            self.emit("disconnect", self);
            self.server.emit("disconnect", self);
            self.server.unregisterRoute(self.jid, self);
        }
    });

    return self;
};
sys.inherits(C2SStream, Connection.Connection);

C2SStream.prototype.startStream = function(streamAttrs) {
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

    attrs.from = this.server.options.domain;

    var el = new ltx.Element('stream:stream', attrs);
    // make it non-empty to cut the closing tag
    el.t(' ');
    var s = el.toString();
    this.send(s.substr(0, s.indexOf(' </stream:stream>')));

    this.sendFeatures();
};

C2SStream.prototype.sendFeatures = function() {
    var features = new ltx.Element('stream:features');
    if (!this.authenticated) {
        // TLS
        if (this.server.options.tls && !this.socket.encrypted) {
            features.c("starttls", {xmlns: NS_XMPP_TLS}).c("required");
        }
        this.mechanisms = sasl.availableMechanisms();

        var mechanismsEl = features.c("mechanisms", { xmlns: NS_XMPP_SASL});
        this.mechanisms.forEach(function(mech) {
            mechanismsEl.c("mechanism").t(mech.name);
	});
    }
    else {
        features.c("bind", {xmlns: 'urn:ietf:params:xml:ns:xmpp-bind'});
        features.c("session", {xmlns: 'urn:ietf:params:xml:ns:xmpp-session'});
    }
    this.send(features);
};

C2SStream.prototype.onRawStanza = function(stanza) {
    var bind, session;

    if (this.jid) {
        stanza.attrs.from = this.jid.toString();
    }

    if (stanza.is('starttls', NS_XMPP_TLS)) {
        this.send(new ltx.Element('proceed', { xmlns: Connection.NS_XMPP_TLS }));
        this.setSecure(this.server.credentials, true);
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
    else if (stanza.is('iq') && stanza.getChild('query', NS_REGISTER)) {
        this.onRegistration(stanza);
    }
    else if (stanza.attrs.to &&
            stanza.attrs.to != "" &&
            stanza.attrs.to != this.server.options.domain &&
            stanza.attrs.to != this.jid.bare().toString()) {
        this.server.router.send(stanza);
    }
    else {
        // Let's trigger self for Mixins
        this.emit('stanza', stanza, this);
        // Then send it to the user code, just in case the user wants to interract with it.
        this.server.emit('stanza', stanza, this);
    }
}

C2SStream.prototype.authenticate = function(username, password) {
    var self = this;
    var jid = new JID(username, this.server.options.domain);
    this.server.emit('authenticate', jid, password, this, function(authenticated) {
        if (authenticated) {
            self.emit('auth-success', jid);
            self.jid = jid;
            self.authenticated = true;
            self.stopParser();
            self.send(new ltx.Element("success", { xmlns: NS_XMPP_SASL }));
            self.startParser();
        }
        else {
            self.emit('auth-failure', jid);
            self.send(new ltx.Element("failure", { xmlns: NS_XMPP_SASL }));
        }
    });
};

C2SStream.prototype.onAuth = function(stanza) {
    var matchingMechs = this.mechanisms.filter(function(mech) {
	return mech.name === stanza.attrs.mechanism;
    });

    if (matchingMechs[0]) {
	this.mechanism = matchingMechs[0];
	this.mechanism.authServer(decode64(stanza.getText()), this);
    } else {
	this.send(new ltx.Element("failure", { xmlns: NS_XMPP_SASL })); // We're doomed. Not right auth mechanism offered.
    }
};

C2SStream.prototype.onRegistration = function(stanza) {
    var self = this;
    var register = stanza.getChild('query', NS_REGISTER);
    var reply = new ltx.Element('iq', { type: 'result' });
    if (stanza.attrs.id)
	reply.attrs.id = stanza.attrs.id;

    if (stanza.attrs.type === 'get') {
	reply.c('query', { xmlns: NS_REGISTER }).
	    c("instructions").t("Choose a username and password for use with this service. ").up().
	    c("username").up().
            c("password");
    }
    else if (stanza.attrs.type === 'set') {
        self.server.emit('register',
			 new JID(register.getChildText('username'), this.server.options.domain),
			 register.getChildText('password'),
			 self,
			 function(registered, reason) {
            if (registered) {
                self.emit('registration-success', self.jid);
            }
            else {
                self.emit('registration-failure', jid);
                reply.attrs.type = "error";
                reply.c("error", { code: reason.code, type: reason.type }).
		    c('text', { xmlns: "urn:ietf:params:xml:ns:xmpp-stanzas" }).t(reason.text);
            }
        });
    }
    self.send(reply);
};

C2SStream.prototype.onBind = function(stanza) {
    var bind = stanza.getChild('bind', 'urn:ietf:params:xml:ns:xmpp-bind');
    var resource;
    if ((resource = bind.getChild("resource", 'urn:ietf:params:xml:ns:xmpp-bind'))) {
        this.jid.setResource(resource.getText());
    }
    else {
        this.jid.setResource(generateId());
    }
    if (this.server.registerRoute(this.jid, this)) {
        this.send(new ltx.Element("iq", { type:"result", id: stanza.attrs.id }).
		  c("bind", { xmlns: "urn:ietf:params:xml:ns:xmpp-bind" }).
		  c("jid").t(this.jid.toString())
		 );
    }
};

C2SStream.prototype.onSession = function(stanza) {
    var self = this;
    self.send(new ltx.Element("iq", { type:"result", id: stanza.attrs.id }).
	      c("session", { xmlns: "urn:ietf:params:xml:ns:xmpp-session"})
	     );
};


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


