var net = require('net');
var sys = require('sys');
var expat = require('expat');
var puts = require('sys').puts;
var xml = require('./xml');

var NS_XMPP_TLS = 'urn:ietf:params:xml:ns:xmpp-tls';

function Connection() {
    net.Stream.call(this);

    this.charset = 'UTF-8';
    this.addListener('connect', this.startStream);
    this.addListener('data', this.onData);
//    this.addListener('end', this.onEnd);
//    this.addListener('error', this.onError);
}

sys.inherits(Connection, net.Stream);
exports.Connection = Connection;

Connection.prototype.send = function(stanza) {
    var self = this;
    if (stanza.root)
	stanza.root().write(function(s) {
	    self.write(s);
	});
    else
	self.write(stanza);
};

Connection.prototype.startParser = function() {
    var self = this;
    self.element = null;
    self.parser = new expat.Parser(self.charset);

    self.parser.addListener('startElement', function(name, attrs) {
	if (!self.element && name == 'stream:stream') {
	    self.streamAttrs = attrs;
	} else {
	    var child = new xml.Element(name, attrs);
	    if (!self.element) {
		/* TODO: add stream xmlns */
		self.element = child;
	    } else {
		self.element = self.element.cnode(child);
	    }
	}
    });
    self.parser.addListener('endElement', function(name, attrs) {
	if (!self.element && name == 'stream:stream') {
	    self.close();
	} else if (self.element && name == self.element.name) {
	    if (self.element.parent)
		self.element = self.element.parent;
	    else {
		/* Stanza complete */
		self.onStanza(self.element);
		self.element = null;
	    }
	} else {
	    self.emit('parseError');
	    self.end();
	}
    });
    self.parser.addListener('text', function(str) {
	if (self.element)
	    self.element.t(str);
    });
};

Connection.prototype.startStream = function() {
    this.startParser();

    var tag = "<stream:stream xmlns='" + this.xmlns +
	"' xmlns:stream='http://etherx.jabber.org/streams'" +
	" to='" + this.streamTo + "'";
    if (this.xmppVersion)
	tag += " version='" + this.xmppVersion + "'";
    tag += ">";
    this.send(tag);
};

Connection.prototype.onData = function(data) {
    if (this.parser) {
	if (!this.parser.parse(data.toString(), false)) {
	    this.emit('parseError');
	    this.end();
	}
    }
};

/**
 * This is not an event listener, but takes care of the authentication
 * before 'stanza' events are emitted to the user.
 */
Connection.prototype.onStanza = function(stanza) {
    puts('Stanza: ' + stanza.toString());

    if (stanza.name == 'stream:features') {
	if (stanza.getChild('starttls', NS_XMPP_TLS)) {
	    this.send(new xml.Element('starttls', { xmlns: NS_XMPP_TLS }));
	}
    } else if (stanza.name == 'proceed' && stanza.getNS() == NS_XMPP_TLS) {
	this.setSecure();
	this.addListener('secure', this.startStream);
    }

    this.emit('stanza', this.element);
};
