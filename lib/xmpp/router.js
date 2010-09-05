var net = require('net');
var Server = require('./server');
var JID = require('./jid');


dbgStream = function(tag, stream) {
    stream.on('data', function(data) {
	console.log(tag + ' in: ' + data);
    });
    stream.on('error', function(e) {
	console.log(tag + ' error: ' + e.stack);
    });
    stream.on('close', function() {
	console.log(tag + ' close');
    });
    var oldSend = stream.send;
    stream.send = function(data) {
	console.log(tag + ' out: ' + data);
	oldSend.call(stream, data);
    };
};

/**
 * Represents a domain we host with connections to federated servers
 */
function DomainContext(domain) {
    this.domain = domain;
    this.s2sIn = {};
    this.s2sOut = {};
}

/**
 * Buffers until stream has been verified via Dialback
 */
DomainContext.prototype.send = function(stanza) {
    if (stanza.root)
	stanza = stanza.root();

    // TODO: return on empty to
    destDomain = new JID.JID(stanza.attrs.to).domain;
    var outStream = this.getOutStream(destDomain);

    if (outStream.isVerified)
	outStream.send(stanza);
    else {
	outStream.queue = outStream.queue || [];
	outStream.queue.push(stanza);
    }
};

/**
 * Does only buffer until stream is established, used for Dialback
 * communication itself.
 *
 * returns the stream
 */
DomainContext.prototype.sendRaw = function(stanza, destDomain) {
    if (stanza.root)
	stanza = stanza.root();

    var outStream = this.getOutStream(destDomain);
    var send = function() {
	outStream.send(stanza);
    };

    if (outStream.isOnline)
	send();
    else
	outStream.addListener('online', send);

    return outStream;
};

DomainContext.prototype.getOutStream = function(domain) {
    var self = this;

    // unfortunately we cannot use the incoming streams

    if (this.s2sOut.hasOwnProperty(domain)) {
	// There's one already
	return this.s2sOut[domain];
    } else {
	console.log("OUTGOING to " + domain);
	// Setup a new outgoing connection
	var outStream = this.s2sOut[domain] =
	    Server.makeOutgoingServer(domain);
	dbgStream('outgoing', outStream);
	this.setupStream(domain, outStream);

	outStream.addListener('close', function() {
	    // TODO: purge queue
	    delete self.s2sOut[domain];
	});

	// Prepare dialback
	outStream.addListener('online', function() {
	    outStream.isOnline = true;
	    outStream.dbKey = generateKey();
	    outStream.send(Server.dialbackKey(self.domain, domain, outStream.dbKey));
	});
	outStream.addListener('dialbackResult', function(from, to, isValid) {
	    if (isValid) {
		outStream.isVerified = true;
		if (outStream.queue) {
		    outStream.queue.forEach(function(stanza) {
			outStream.send(stanza);
		    });
		    delete outStream.queue;
		}
	    } else {
		// we cannot do anything else with this stream that
		// failed dialback
		outStream.end();
	    }
	});

	return outStream;
    }
};

/**
 * Called by router when verification is done
 */
DomainContext.prototype.addInStream = function(domain, stream) {
    var self = this;

    if (this.s2sIn.hasOwnProperty(domain)) {
	// Replace old
	var oldStream = this.s2sIn[domain];
	oldStream.error('conflict', 'Connection replaced');
    }

    this.setupStream(domain, stream);
    stream.isOnline = true;
    stream.isVerified = true;
    stream.addListener('close', function() {
	if (self.s2sIn[domain] == stream)
	    delete self.s2sIn[domain];
    });
    this.s2sIn[domain] = stream;
};

DomainContext.prototype.setupStream = function(domain, stream) {
    var self = this;

    stream.addListener('stanza', function(stanza) {
	// Before verified they can send whatever they want
	if (!stream.isVerified)
	    return;

	if (!(typeof stanza.attrs.from === 'string' &&
	      typeof stanza.attrs.to === 'string')) {
	    stream.error('improper-addressing');
	    return;
	}

	var fromDomain = (new JID.JID(stanza.attrs.from)).domain;
	if (fromDomain !== domain) {
	    stream.error('invalid-from');
	    return;
	}

	var toDomain = (new JID.JID(stanza.attrs.to)).domain;
	if (toDomain !== self.domain) {
	    stream.error('improper-addressing');
	    return;
	}

	self.receive(stanza);
    });
};

DomainContext.prototype.verifyDialback = function(domain, id, key) {
    var outStream;
    if (this.s2sOut.hasOwnProperty(domain) &&
	(outStream = this.s2sOut[domain])) {

	var isValid = outStream.streamAttrs.id === id &&
	    outStream.dbKey === key;

	return isValid;
    } else
	return false;
};

DomainContext.prototype.receive = function(stanza) {
    if (this.stanzaListener)
	this.stanzaListener(stanza);
};

/**
 * TODO:
 * * recv stanzas
 * * karma
 * * nameprep
 * * timeouts
 * * parser errors
 * * keepAlive
 * * TLS
 */
function Router(s2sPort) {
    var self = this;
    this.ctxs = {};

    net.createServer(function(inStream) {
	self.acceptConnection(inStream);
    }).listen(s2sPort || 5269);
}
exports.Router = Router;

Router.prototype.acceptConnection = function(inStream) {
    var self = this;

    Server.makeIncomingServer(inStream);
    console.log('INCOMING from ' + inStream.remoteAddress);
    dbgStream('incoming', inStream);

    // incoming server wants to verify an outgoing connection of ours
    inStream.addListener('dialbackVerify', function(from, to, id, key) {
	var isValid = self.verifyDialback(from, to, id, key);
	inStream.send(Server.dialbackVerified(to, from, id, isValid));
    });
    // incoming connection wants to get verified
    inStream.addListener('dialbackKey', function(from, to, key) {
	var destDomain = to;
	if (self.hasContext(to)) {
	    var ctx = self.getContext(to);
	    var outStream = ctx.sendRaw(Server.dialbackVerify(to, from, inStream.streamId, key),
					from);

	    // TODO: hook inStream close
	    var onVerified, onClose;
	    onVerified = function(from, to, id, isValid) {
		if (to !== destDomain ||
		    id != inStream.streamId)  // not for us
		    return;

		inStream.send(Server.dialbackResult(to, from, isValid));

		if (isValid && self.hasContext(to)) {
		    self.getContext(to).addInStream(from, inStream);
		} else {
		    // the connection isn't used for another domain, so
		    // closing is safe
		    inStream.send('</stream:stream>');
		    inStream.end();
		}

		outStream.removeListener('dialbackVerified', onVerified);
		outStream.removeListener('close', onClose);
	    };
	    onClose = function() {
		// outgoing connection didn't work out, tell the incoming
		// connection
		inStream.send(Server.dialbackResult(to, from, false));
	    };
	    outStream.addListener('dialbackVerified', onVerified);
	    outStream.addListener('close', onClose);
	} else {
	    inStream.error('host-unknown', to + ' is not served here');
	}
    });
};

/**
 * Create domain context & register a stanza listener callback
 */
Router.prototype.register = function(domain, listener) {
    this.getContext(domain).stanzaListener = listener;
};

// TODO: unregister w/ connections teardown

Router.prototype.send = function(stanza) {
    if (stanza.root)
	stanza = stanza.root();

    if (stanza.attrs && stanza.attrs.from) {
	var domain = (new JID.JID(stanza.attrs.from)).domain;
	this.getContext(domain).send(stanza);
    } else
	throw 'Sending stanza without destination';
};

Router.prototype.hasContext = function(domain) {
    return this.ctxs.hasOwnProperty(domain);
};

Router.prototype.getContext = function(domain) {
    if (this.ctxs.hasOwnProperty(domain))
	return this.ctxs[domain];
    else
	return (this.ctxs[domain] = new DomainContext(domain));
};

Router.prototype.verifyDialback = function(from, to, id, key) {
    return this.hasContext(to) &&
	this.getContext(to).verifyDialback(from, id, key);
};


function generateKey() {
    var r = new Buffer(16);
    for(var i = 0; i < r.length; i++) {
	r[i] = 48 + Math.floor(Math.random() * 10);  // '0'..'9'
    }
    return r.toString();
}
