var net = require('net');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var ltx = require('ltx');
var StreamParser = require('./stream_parser');
var starttls = require('../starttls');

var NS_XMPP_TLS = exports.NS_XMPP_TLS = 'urn:ietf:params:xml:ns:xmpp-tls';
var NS_STREAM = exports.NS_STREAM = 'http://etherx.jabber.org/streams';
var NS_XMPP_STREAMS = 'urn:ietf:params:xml:ns:xmpp-streams';

/**
 Base class for connection-based streams.

 The socket parameter is optional for incoming connections.
 
 A note on events: this base class will emit 'rawStanza' and leaves
 'stanza' to Client & Component. Therefore we won't confuse the
 user with stanzas before authentication has finished.
*/

var MAX_RECONNECT_DELAY = 30 * 1000;


function Connection(socket) {
    EventEmitter.call(this);

    this.charset = 'UTF-8';
    this.xmlns = { stream: NS_STREAM };

    this.socket = socket || new net.Socket();
    this.reconnectDelay = 0;

    this.setupStream();

    this.mixins = [];
}

util.inherits(Connection, EventEmitter);
exports.Connection = Connection;

// Defaults
Connection.prototype.charset = 'UTF-8';
Connection.prototype.allowTLS = true;

/**
 Used by both the constructor and by reinitialization in setSecure().
*/
Connection.prototype.setupStream = function() {
    var self = this;
    this.reconnectDelay = 0;
    this.socket.addListener('data', function(data) {
        self.onData(data);
    });
    this.socket.addListener('end', function() {
        self.onEnd();
    });
    this.socket.addListener('error', function() {
	/* unhandled errors may throw up in node, preventing a reconnect */
        self.onEnd();
    });
    this.socket.addListener('close', function() {
	self.onClose();
    });
    var proxyEvent = function(event) {
        self.socket.addListener(event, function() {
	    var args = Array.prototype.slice.call(arguments);
	    args.unshift(event);
	    self.emit.apply(self, args);
        });
    };
    proxyEvent('data');  // let them sniff unparsed XML
    proxyEvent('drain');
    proxyEvent('close');

    /**
     * This is optimized for continuous TCP streams. If your "socket"
     * actually transports frames (WebSockets) and you can't have
     * stanzas split across those, use:
     *     cb(el.toString());
     */
    if (!this.socket.serializeStanza) {
        this.socket.serializeStanza = function(el, cb) {
            // Continuously write out
            el.write(function(s) {
                cb(s);
            });
        };
    }
};

/** Climbs the stanza up if a child was passed,
    but you can send strings and buffers too.

    Returns whether the socket flushed data.
*/
Connection.prototype.send = function(stanza) {
    var self = this;
    var flushed = true;
    if (!this.socket.writable) {
        this.socket.end();
        return;
    }

    if (stanza.root) {
        var el = this.rmStreamNs(stanza.root());
        this.socket.serializeStanza(el, function(s) {
            flushed = self.socket.write(s);
        });
    } else {
        flushed = this.socket.write(stanza);
    }
    return flushed;
};

Connection.prototype.startParser = function() {
    var self = this;
    this.parser = new StreamParser.StreamParser(this.charset, this.maxStanzaSize);

    this.parser.addListener('start', function(attrs) {
        self.streamAttrs = attrs;
        /* We need those xmlns often, store them extra */
        self.streamNsAttrs = {};
        for(var k in attrs) {
        if (k == 'xmlns' ||
            k.substr(0, 6) == 'xmlns:')
                self.streamNsAttrs[k] = attrs[k];
        }

        /* Notify in case we don't wait for <stream:features/>
           (Component or non-1.0 streams)
         */
        self.emit('streamStart', attrs);
    });
    this.parser.addListener('stanza', function(stanza) {
        self.onStanza(self.addStreamNs(stanza));
    });
    this.parser.addListener('error', function(e) {
        self.error(e.condition || 'internal-server-error', e.message);
    });
    this.parser.addListener('end', function() {
        self.stopParser();
        self.end();
    });
};

Connection.prototype.stopParser = function() {
    /* No more events, please (may happen however) */
    if(this.parser) {
        this.parser.stop();
        /* Get GC'ed */
        delete this.parser;
    }
};

Connection.prototype.startStream = function() {
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
    if (this.streamId)
        attrs.id = this.streamId;

    var el = new ltx.Element('stream:stream', attrs);
    // make it non-empty to cut the closing tag
    el.t(' ');
    var s = el.toString();
    this.send(s.substr(0, s.indexOf(' </stream:stream>')));

    this.streamOpened = true;
};

Connection.prototype.onData = function(data) {
    if (this.parser)
        this.parser.write(data);
};

Connection.prototype.setSecure = function(credentials, isServer) {
    var self = this;
    this.stopParser();

    // Remove old event listeners
    this.socket.removeAllListeners('data');
    // retain socket 'end' listeners because ssl layer doesn't support it
    this.socket.removeAllListeners('drain');
    this.socket.removeAllListeners('close');
    // remove idle_timeout
    if (this.socket.clearTimer)
	this.socket.clearTimer();

    var ct = starttls(this.socket, credentials || this.credentials, isServer, function() {
	self.isSecure = true;
	if (!isServer)
	    // Clients start <stream:stream>, servers reply
	    self.startStream();
        self.startParser();
    });
    ct.on('close', function() {
	self.onClose();
    });

    // The socket is now the cleartext stream
    this.socket = ct;

    // Attach new listeners on the cleartext stream
    this.setupStream();
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
	       !this.isSecure &&
               stanza.getChild('starttls', NS_XMPP_TLS)) {
        /* Signal willingness to perform TLS handshake */
        this.send(new ltx.Element('starttls', { xmlns: NS_XMPP_TLS }));
    } else if (this.allowTLS &&
               stanza.is('proceed', NS_XMPP_TLS)) {
        /* Server is waiting for TLS handshake */
        this.setSecure();
    } else {
        this.emit('rawStanza', stanza);
    }
};

/**
 * Add stream xmlns to a stanza
 *
 * Does not add our default xmlns as it is different for
 * C2S/S2S/Component connections.
 */
Connection.prototype.addStreamNs = function(stanza) {
    for(var attr in this.streamNsAttrs) {
        if (!stanza.attrs[attr] &&
	    !(attr === 'xmlns' &&
	      this.streamNsAttrs[attr] === this.xmlns['']))
            stanza.attrs[attr] = this.streamNsAttrs[attr];
    }
    return stanza;
};

/**
 * Remove superfluous xmlns that were aleady declared in
 * our <stream:stream>
 */
Connection.prototype.rmStreamNs = function(stanza) {
    for(var prefix in this.xmlns) {
        var attr = prefix ? 'xmlns:'+prefix : 'xmlns';
        if (stanza.attrs[attr] == this.xmlns[prefix])
            delete stanza.attrs[attr];
    }
    return stanza;
};


/**
 * Connection has been ended by remote, we will not get any incoming
 * 'data' events. Alternatively, used for 'error' event.
 */
Connection.prototype.onEnd = function() {
    this.stopParser();
    this.socket.end();
};

/**
 * XMPP-style end connection for user
 */
Connection.prototype.end = function() {
    if (this.socket.writable) {
        if (this.streamOpened) {
            this.socket.write('</stream:stream>');
            delete this.streamOpened;
	    /* wait for being called again upon 'end' from other side */
        } else {
            this.socket.end();
        }
    }
};

Connection.prototype.onClose = function() {
    if (!this.socket)
	/* A reconnect may have already been scheduled */
	return;

    delete this.socket;
    if (this.reconnect) {
	var self = this;
	setTimeout(function() {
	    self.socket = new net.Stream();
	    self.setupStream();
	    self.reconnect();
	}, this.reconnectDelay);
	console.log("Reconnect in", this.reconnectDelay);
	this.reconnectDelay += Math.ceil(Math.random() * 2000);
	if (this.reconnectDelay > MAX_RECONNECT_DELAY)
	    this.reconnectDelay = MAX_RECONNECT_DELAY;
    }
};

/**
 * End connection with stream error.
 * Emits 'error' event too.
 *
 * @param {String} condition XMPP error condition, see RFC3920 4.7.3. Defined Conditions
 * @param {String} text Optional error message
 */
Connection.prototype.error = function(condition, message) {
    this.emit('error', new Error(message));

    if (!this.socket.writable)
        return;

    if(!this.streamOpened)
        this.startStream(); /* RFC 3920, 4.7.1 stream-level errors rules */

    var e = new ltx.Element('stream:error');
    e.c(condition, { xmlns: NS_XMPP_STREAMS });
    if (message)
        e.c('text', { xmlns: NS_XMPP_STREAMS,
                      'xml:lang': 'en' }).
        t(message);

    this.send(e);
    this.end();
};

/**
 * Adds a mixin to this Connection for implementing higher-level functionality.
 *
 * A mixin is a module that exports a single function, taking the 
 * Connection as its value. The module can perform its own stanza-handling, 
 * event emission and other functionality. Note that mixins can only be 
 * added once.
*/
Connection.prototype.addMixin = function(mixin, mixinArgs) {
    if(this.mixins.indexOf(mixin) == -1) {
        mixin(this, mixinArgs);
        this.mixins = this.mixins.concat(mixin);
    }
};
