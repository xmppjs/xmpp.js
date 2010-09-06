var dns = require('dns');
var Connection = require('./connection');
var xml = require('./xml');

var NS_SERVER = 'jabber:server';
var NS_DIALBACK = 'jabber:server:dialback';
var NS_XMPP_STREAMS = 'urn:ietf:params:xml:ns:xmpp-streams';

/**
 * Dialback-specific events:
 * (1) dialbackKey(from, to, key)
 * (2) dialbackVerify(from, to, id, key)
 * (3) dialbackVerified(from, to, id, isValid)
 * (4) dialbackResult(from, to, isValid)
 */
function initServer(self) {
    self.xmlns = NS_SERVER;
    self.xmppVersion = '1.0';

    self.addListener('rawStanza', function(stanza) {
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

exports.dialbackKey = function(from, to, key) {
    return new xml.Element('db:result', { to: to,
					  from: from }).
	t(key);
};
exports.dialbackVerify = function(from, to, id, key) {
    return new xml.Element('db:verify', { to: to,
					  from: from,
					  id: id }).
	t(key);
};
exports.dialbackVerified = function(from, to, id, isValid) {
    return new xml.Element('db:verify', { to: to,
					  from: from,
					  id: id,
					  type: isValid ? 'valid' : 'invalid' });
};
exports.dialbackResult = function(from, to, isValid) {
    return new xml.Element('db:result', { to: to,
					  from: from,
					  type: isValid ? 'valid' : 'invalid' });
};

exports.makeIncomingServer = function(self) {
    Connection.makeConnection(self);

    initServer(self);
    // No credentials means we cannot <starttls/> on the server
    // side. Unfortunately this is required for XMPP 1.0.
    if (!self.credentials)
	delete self.xmppVersion;
    self.startStream();
    self.streamId = generateId();

    self.addListener('streamStart', function(streamAttrs) {
	var tag = "<stream:stream xmlns='" + self.xmlns +
	    "' xmlns:stream='" + Connection.NS_STREAM +
	    "' xmlns:db='" + NS_DIALBACK +
	    "' id='" + self.streamId + "'";
	if (self.xmppVersion)
	    tag += " version='" + self.xmppVersion + "'";
	tag += ">";
	if (self.xmppVersion == '1.0') {
	    tag += "<stream:features>";
	    if (self.credentials && !self.secureEstablished)
		tag += "<starttls xmlns='" + Connection.NS_XMPP_TLS + "'/>";
	    tag += "</stream:features>";
	}
	self.send(tag);
    });
    self.addListener('rawStanza', function(stanza) {
			 if (stanza.is('starttls', Connection.NS_XMPP_TLS)) {
			     self.send(new xml.Element('proceed', { xmlns: Connection.NS_XMPP_TLS }));
			     self.stopParser();
			     console.log("setSecure...");
			     self.setSecure(self.credentials);
			     self.addListener('secure', function() {
						  console.log("secure!!!");
						  self.startParser();
					      });
			 }
		     });

    return self;
};

function dnsLookup(domain, cb) {
    // TODO: improve SRV lookups
    dns.resolveSrv('_xmpp-server._tcp.' + domain, function(error, data) {
	if (data && data[0])
	    cb(data[0].name, data[0].port);
	else
	    dns.resolveSrv('_jabber._tcp.' + domain, function(error, data) {
		if (data && data[0])
		    cb(data[0].name, data[0].port);
		else
		    cb(domain, 5269);
	    });
    });
}

exports.makeOutgoingServer = function(domain) {
    var self = new Connection.Connection();
    initServer(self);
    self.startStream = function() {
	Connection.Connection.prototype.startStream.call(self);

	var tag = "<stream:stream xmlns='" + self.xmlns +
	    "' xmlns:stream='" + Connection.NS_STREAM +
	    "' xmlns:db='" + NS_DIALBACK +
	    "' to='" + domain + "'";
	if (self.xmppVersion)
	    tag += " version='" + self.xmppVersion + "'";
	tag += ">";
	self.send(tag);
    };

    dnsLookup(domain, function(host, port) {
	self.connect(port, host);
	self.addListener('connect', self.startStream);
    });

    self.addListener('streamStart', function(attrs) {
			 if (attrs.version !== "1.0")
			     // Don't wait for <stream:features/>
			     self.emit('online');
		     });
    self.addListener('rawStanza', function(stanza) {
	if (stanza.is('features', Connection.NS_STREAM)) {
	    self.emit('online');
	}
    });

    return self;
};

function generateId() {
    var r = new Buffer(16);
    for(var i = 0; i < r.length; i++) {
	r[i] = 48 + Math.floor(Math.random() * 10);  // '0'..'9'
    }
    return r.toString();
};
