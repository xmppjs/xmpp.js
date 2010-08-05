var net = require('net');
var sys = require('sys');
var expat = require('node-expat');
var xml = require('./xml');

var NS_XMPP_TLS = exports.NS_XMPP_TLS = 'urn:ietf:params:xml:ns:xmpp-tls';
var NS_STREAM = exports.NS_STREAM = 'http://etherx.jabber.org/streams';

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
    if (!this.writable) {
	this.end();
	return;
    }

    if (stanza.root) {
	var el = this.rmStreamNs(stanza.root());
	var self = this;
	el.write(function(s) { self.write(s); });
	return el;
    }
    else {
	this.write(stanza);
	return stanza;
    }
};

Connection.prototype.startParser = function() {
    var self = this;
    self.element = null;
    self.parser = new expat.Parser(self.charset);

    self.parser.addListener('startElement', function(name, attrs) {
	if (!self.element && name == 'stream:stream') {
	    self.streamAttrs = attrs;
	    /* We need those xmlns often, store them extra */
	    self.streamNsAttrs = {};
	    for(var k in attrs) {
		if (k == 'xmlns' ||
		    k.substr(0, 6) == 'xmlns:')
		    self.streamNsAttrs[k] = attrs[k];
	    }

	    /* Notify in case we don't wait for <stream:features/> (Component)
	     */
	    self.emit('streamStart', attrs);
	     } else {
	    var child = new xml.Element(name, attrs);
	    if (!self.element) {
		/* A new stanza */
		self.element = self.addStreamNs(child);
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
	"' xmlns:stream='" + NS_STREAM + "'" +
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
    if (stanza.is('error', NS_STREAM)) {
	/* TODO: extract error text */
	this.emit('error', stanza);
    } else if (stanza.is('features', NS_STREAM) &&
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

/**
 *  Add stream xmlns to a stanza, so the user can check for
 * 'jabber:client' etc.
 */
Connection.prototype.addStreamNs = function(stanza) {
    for(var k in this.streamNsAttrs) {
	if (!stanza.attrs[k])
	    stanza.attrs[k] = this.streamNsAttrs[k];
    }
    return stanza;
};

/**
 * Remove superfluous xmlns that were aleady declared in
 * <stream:stream>
 */
Connection.prototype.rmStreamNs = function(stanza) {
    for(var k in this.streamNsAttrs) {
	if (stanza.attrs[k] == this.streamNsAttrs[k])
	    delete stanza.attrs[k];
    }
    return stanza;
};

