var dns = require('dns');
var Connection = require('./connection');
var ltx = require('ltx');
var util = require('util');
var SRV = require('./srv');

var NS_SERVER = 'jabber:server';
var NS_DIALBACK = 'jabber:server:dialback';
var NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl';

/**
 * Dialback-specific events:
 * (1) dialbackKey(from, to, key)
 * (2) dialbackVerify(from, to, id, key)
 * (3) dialbackVerified(from, to, id, isValid)
 * (4) dialbackResult(from, to, isValid)
 */
function Server(socket) {
    var self = this;
    Connection.Connection.call(this, socket);

    this.xmlns[''] = NS_SERVER;
    this.xmlns['db'] = NS_DIALBACK;
    this.xmppVersion = '1.0';

    this.addListener('rawStanza', function(stanza) {
        var key = stanza.getText();

        if (stanza.is('result', NS_DIALBACK)) {
            if (stanza.attrs.from && stanza.attrs.to &&
                stanza.attrs.type) {

                self.emit('dialbackResult',
                          stanza.attrs.from, stanza.attrs.to,
                          stanza.attrs.type == 'valid');

            } else if (stanza.attrs.from && stanza.attrs.to) {

                self.emit('dialbackKey',
                          stanza.attrs.from, stanza.attrs.to,
                          key);

            }
        } else if (stanza.is('verify', NS_DIALBACK)) {
            if (stanza.attrs.from && stanza.attrs.to &&
                stanza.attrs.id && stanza.attrs.type) {

                self.emit('dialbackVerified',
                          stanza.attrs.from, stanza.attrs.to,
                          stanza.attrs.id, stanza.attrs.type == 'valid');

            } else if (stanza.attrs.from && stanza.attrs.to &&
                       stanza.attrs.id) {

                self.emit('dialbackVerify',
                          stanza.attrs.from, stanza.attrs.to,
                          stanza.attrs.id, key);
            }
        } else
            self.emit('stanza', stanza);
    });
}
util.inherits(Server, Connection.Connection);

exports.dialbackKey = function(from, to, key) {
    return new ltx.Element('db:result', { to: to,
                                          from: from }).
        t(key);
};
exports.dialbackVerify = function(from, to, id, key) {
    return new ltx.Element('db:verify', { to: to,
                                          from: from,
                                          id: id }).
        t(key);
};
exports.dialbackVerified = function(from, to, id, isValid) {
    return new ltx.Element('db:verify', { to: to,
                                          from: from,
                                          id: id,
                                          type: isValid ? 'valid' : 'invalid' });
};
exports.dialbackResult = function(from, to, isValid) {
    return new ltx.Element('db:result', { to: to,
                                          from: from,
                                          type: isValid ? 'valid' : 'invalid' });
};

exports.IncomingServer = function(stream, credentials) {
    var self = this;
    Server.call(this, stream);

    this.startParser();
    this.streamId = generateId();

    this.addListener('streamStart', function(streamAttrs) {
        if (streamAttrs.to &&
            credentials &&
            credentials.hasOwnProperty(streamAttrs.to))
            // TLS cert & key for this domain
            self.credentials = credentials[streamAttrs.to];
        // No credentials means we cannot <starttls/> on the server
        // side. Unfortunately this is required for XMPP 1.0.
        if (!self.credentials)
            delete self.xmppVersion;

        self.startStream();
    });
    this.addListener('rawStanza', function(stanza) {
        if (stanza.is('starttls', Connection.NS_XMPP_TLS)) {
            self.send(new ltx.Element('proceed', { xmlns: Connection.NS_XMPP_TLS }));
            self.setSecure(self.credentials, true);
        }
    });

    return self;
};
util.inherits(exports.IncomingServer, Server);

exports.IncomingServer.prototype.startStream = function() {
    Server.prototype.startStream.call(this);

    if (this.xmppVersion == '1.0') {
        this.send("<stream:features>");
        if (this.credentials && !this.isSecure)
            this.send("<starttls xmlns='" + Connection.NS_XMPP_TLS + "'/>");
        this.send("</stream:features>");
    }
};

exports.OutgoingServer = function(srcDomain, destDomain, credentials) {
    var self = this;
    Server.call(this);

    this.streamTo = destDomain;
    // For outgoing, we only need our own cert & key
    this.credentials = credentials;
    // No credentials means we cannot <starttls/> on the server
    // side. Unfortunately this is required for XMPP 1.0.
    if (!this.credentials)
        delete this.xmppVersion;

    this.socket.addListener('secure', function() {
        self.startStream();
    });
    this.addListener('streamStart', function(attrs) {
                         if (attrs.version !== "1.0")
                             // Don't wait for <stream:features/>
                             self.emit('auth', 'dialback');
                     });
    self.addListener('rawStanza', function(stanza) {
        if (stanza.is('features', Connection.NS_STREAM)) {
            var mechsEl;
            if ((mechsEl = stanza.getChild('mechanisms', NS_XMPP_SASL))) {
                var mechs = mechsEl.getChildren('mechanism', NS_XMPP_SASL).
                    map(function(el) { return el.getText(); });
                if (mechs.indexOf('EXTERNAL') >= 0)
                    self.emit('auth', 'external');
                else
                    self.emit('auth', 'dialback');
            } else {
                // No SASL mechanisms
                self.emit('auth', 'dialback');
            }
        }
    });

    var attempt = SRV.connect(this.socket, ['_xmpp-server._tcp',
                                            '_jabber._tcp'],
                              destDomain, 5269);
    attempt.addListener('connect', function() {
        self.startParser();
        self.startStream();
    });
    attempt.addListener('error', function(e) {
        self.emit('error', e);
    });
};
util.inherits(exports.OutgoingServer, Server);

function generateId() {
    var r = new Buffer(16);
    for(var i = 0; i < r.length; i++) {
        r[i] = 48 + Math.floor(Math.random() * 10);  // '0'..'9'
    }
    return r.toString();
};
