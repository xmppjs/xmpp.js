var net = require('net');
var sys = require('sys');
var expat = require('expat');
var xml = require('./xml');

var NS_XMPP_TLS = 'urn:ietf:params:xml:ns:xmpp-tls';

/** A note on events: this base class will emit 'rawStanza' and leaves
    'stanza' to Client & Component. Therefore we won't confuse the
    user with stanzas before authentication has finished.
*/
function Connection() {
net.Stream.call(this);

    this.charset = 'UTF-8';
    this.allowTLS = true;  /* can be set by user */
    this.addListener('connect', this.startStream);
    this.addListener('data', this.onData);
//    this.addListener('end', this.onEnd);
//    this.addListener('error', this.onError);
}

sys.inherits(Connection, net.Stream);
exports.Connection = Connection;

Connection.prototype.send = function(stanza) {
    var self = this;
    if (stanza.root) {
	var el = stanza.root();
	/* Remove superfluous xmlns that were aleady declared in
	   <stream:stream> */
	for(var k in self.streamAttrs) {
	    if ((k == 'xmlns' ||
		 k.substr(0, 6) == 'xmlns:') &&
		el.attrs[k] == this.streamAttrs[k])
		el.attrs[k] = self.streamAttrs[k]
	}
	
	el.write(function(s) { self.write(s); });
    }
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
		/* Add stream xmlns, so the user can check for
		   'jabber:client' etc. */
		for(var k in self.streamAttrs) {
		    if ((k == 'xmlns' ||
			 k.substr(0, 6) == 'xmlns:') &&
			!child.attrs[k])
			child.attrs[k] = self.streamAttrs[k]
		}
		/* A new stanza */
		self.element = child;
	    } else {
		/* A child element of a stanza */
		self.element = self.element.cnode(child);
	    }
	}
    });
    self.parser.addListener('endElement', function(name, attrs) {
	if (!self.element && name == 'stream:stream') {
	    self.end();
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
	if (!this.parser.parse(data, false)) {
	    this.emit('parseError');
	    this.end();
	}
    }
};

/**
 * This is not an event listener, but takes care of the TLS handshake
 * before 'rawStanza' events are emitted to the derived classes.
 */
Connection.prototype.onStanza = function(stanza) {
    if (stanza.name == 'stream:error') {
	/* TODO: extract error text */
	this.emit('error', stanza);
    } else if (stanza.name == 'stream:features' &&
	this.allowTLS &&
	stanza.getChild('starttls', NS_XMPP_TLS)) {
	/* Signal willingness to perform TLS handshake */
	this.send(new xml.Element('starttls', { xmlns: NS_XMPP_TLS }));
    } else if (this.allowTLS &&
	       stanza.is('proceed', NS_XMPP_TLS)) {
	/* Server is waiting for TLS handshake */
	this.setSecure();
	this.addListener('secure', this.startStream);
    } else {
	this.emit('rawStanza', stanza);
    }
};


