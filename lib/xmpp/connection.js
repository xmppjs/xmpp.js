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

    initConnection(this);
}

sys.inherits(Connection, net.Stream);
exports.Connection = Connection;

// Defaults
Connection.prototype.charset = 'UTF-8';
Connection.prototype.allowTLS = true;


/** Constructor code, usable for existing streams
 */
function makeConnection(conn) {
    for(var k in Connection.prototype)
	if (Connection.prototype.hasOwnProperty(k))
	    conn[k] = Connection.prototype[k];

    initConnection(conn);
}
exports.makeConnection = makeConnection;

/** Actual constructor code
 */
function initConnection(conn) {
    conn.charset = 'UTF-8';

    conn.addListener('data', conn.onData);
    conn.addListener('end', conn.onEnd);
    conn.addListener('error', conn.onEnd);
}

/** Climbs the stanza up if a child was passed,
    but you can send strings and buffers too.
*/
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
    self.setEncoding('utf8');
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

Connection.prototype.stopParser = function() {
    delete this.element;
    delete this.parser;
};

Connection.prototype.startStream = function() {
    this.startParser();
};

Connection.prototype.onData = function(data) {
    if (this.parser) {
	if (!this.parser.parse(data, false)) {
	    this.emit('error', 'XMPP parse error');
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


/**
 * Connection has been ended by remote, we will not get any incoming
 * 'data' events. Alternatively, used for 'error' event.
 *
 * We don't deal with half-closed connections and end our half too.
 */
Connection.prototype.onEnd = function() {
    this.stopParser();
    this.end();
};

/**
 * XMPP-style end connection for user
 */
Connection.prototype.end = function() {
    if (this.writable)
	this.send('</stream:stream>');
    net.Stream.prototype.end.call(this);
    // stopParser will called on 'end'/'error' event
};

/**
 * End connection with stream error
 *
 * @param {String} condition XMPP error condition, see RFC3920 4.7.3. Defined Conditions
 * @param {String} text Optional error message
 */
Connection.prototype.error = function(condition, text) {
    if (!this.writable)
	return;

    var e = new xml.Element('stream:error');
    e.c(condition, { xmlns: NS_XMPP_STREAMS });
    if (text)
	e.c('text', { xmlns: NS_XMPP_STREAMS,
		      'xml:lang': 'en' }).
	t(text);

    this.send(e);
    this.end();
};
