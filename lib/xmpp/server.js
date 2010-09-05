var dns = require('dns');
var Connection = require('./connection');
var xml = require('./xml');

var NS_SERVER = 'jabber:server';
var NS_DIALBACK = 'jabber:server:dialback';

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

	if (stanza.is('result', NS_DIALBACK) &&
	    stanza.attrs.from && stanza.attrs.to &&
	    key.length > 0) {

	    self.emit('dialbackKey',
		      stanza.attrs.from, stanza.attrs.to,
		      key);

	} else if (stanza.is('verify', NS_DIALBACK) &&
		   stanza.attrs.from && stanza.attrs.to &&
		   stanza.attrs.id && key.length > 0) {

	    self.emit('dialbackVerify',
		      stanza.attrs.from, stanza.attrs.to,
		      stanza.attrs.id, key);

	} else if (stanza.is('verify', NS_DIALBACK) &&
		   stanza.attrs.from && stanza.attrs.to &&
		   stanza.attrs.id && stanza.attrs.type) {

	    self.emit('dialbackVerified',
		      stanza.attrs.from, stanza.attrs.to,
		      stanza.attrs.id, stanza.attrs.type == 'valid');

	} else if (stanza.is('result', NS_DIALBACK) &&
		   stanza.attrs.from && stanza.attrs.to &&
		   stanza.attrs.type) {

	    self.emit('dialbackResult',
		      stanza.attrs.from, stanza.attrs.to,
		      stanza.attrs.type == 'valid');
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
    self.startStream();
    self.streamId = generateId();

    self.addListener('streamStart', function(streamAttrs) {
	var tag = "<stream:stream xmlns='" + self.xmlns +
	    "' xmlns:stream='" + Connection.NS_STREAM +
	    "' xmlns:db='" + NS_DIALBACK +
	    "' id='" + self.streamId + "'";
	if (self.xmppVersion)
	    tag += " version='" + self.xmppVersion + "'";
	tag += "><stream:features/>";
	self.send(tag);
    });

    return self;
};

function dnsLookup(domain, cb) {
    dns.resolveSrv('_xmpp-server._tcp.' + domain, function(error, data) {
	if (data[0])
	    cb(data[0].name, data[0].port);
	else
	    dns.resolveSrv('_jabber._tcp.' + domain, function(error, data) {
		if (data[0])
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
