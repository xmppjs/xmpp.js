var net = require('net');
var Server = require('./server');
var JID = require('./jid');
var ltx = require('ltx');
var StreamShaper = require('./../stream_shaper');
var IdleTimeout = require('./../idle_timeout');
try {
    var StringPrep = require('node-stringprep').StringPrep;
    var c = function(n) {
	var p = new StringPrep(n);
	return function(s) {
	    return p.prepare(s);
	};
    };
    var nameprep = c('nameprep');
} catch (ex) {
    var nameprep = function(a) { return a; };
}

var NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl';
var NS_XMPP_STANZAS = 'urn:ietf:params:xml:ns:xmpp-stanzas';


/**
 * Represents a domain we host with connections to federated servers
 */
function DomainContext(router, domain) {
    this.router = router;
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

    // no destination? return to ourself
    if (!stanza.attrs.to) {
        // do not provoke ping-pong effects
        if (stanza.attrs.type === 'error')
            return;

        stanza.attrs.to = stanza.attrs.from;
        delete stanza.attrs.from;
        stanza.attrs.type = 'error';
        stanza.c('error', { type: 'modify' }).
            c('jid-malformed', { xmlns: NS_XMPP_STANZAS });
        this.receive(stanza);

        return;
    }

    var destDomain = new JID.JID(stanza.attrs.to).domain;
    var outStream = this.getOutStream(destDomain);

    if (outStream.isAuthed)
        outStream.send(stanza);
    else {
        // TODO: queues per domain in domaincontext
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

    if (outStream.isConnected)
        send();
    else
        outStream.addListener('online', send);

    return outStream;
};

/**
 * Establish outgoing stream on demand
 */
DomainContext.prototype.getOutStream = function(destDomain) {
    var self = this;

    // unfortunately we cannot use the incoming streams

    if (!destDomain) {
        throw new Error('Trying to reach empty domain');
    } else if (this.s2sOut.hasOwnProperty(destDomain)) {
        // There's one already
        return this.s2sOut[destDomain];
    } else {
        var credentials = this.router.credentials[this.domain];
        // Setup a new outgoing connection
        var outStream = new Server.OutgoingServer(this.domain, destDomain, credentials);
        this.s2sOut[destDomain] = outStream;

        this.router.setupStream(outStream);
        this.setupStream(destDomain, outStream);

        var closeCb = function() {
            // purge queue
            if (outStream.queue) {
                outStream.queue.forEach(function(stanza) {
                                            // do not provoke ping-pong effects
                                            if (stanza.attrs.type === 'error')
                                                return;

                                            var dest = stanza.attrs.to;
                                            stanza.attrs.to = stanza.attrs.from;
                                            stanza.attrs.from = dest;
                                            stanza.attrs.type = 'error';
                                            stanza.c('error', { type: 'cancel' }).
                                                c('remote-server-not-found', { xmlns: NS_XMPP_STANZAS });
                                            self.receive(stanza);
                                        });
            }
            delete outStream.queue;

            // remove from DomainContext
            delete self.s2sOut[destDomain];
        };
        outStream.addListener('close', closeCb);
        outStream.addListener('error', closeCb);

        var onAuth =  function(method) {
            outStream.isConnected = true;
            switch(method) {
            case 'dialback':
                self.startDialback(destDomain, outStream);
                break;

            case 'external':
                outStream.send(new ltx.Element('auth', { xmlns: NS_XMPP_SASL,
                                                         mechanism: 'EXTERNAL' }).
                               t(new Buffer(self.domain).toString('base64'))
                              );
                var onStanza;
                onStanza = function(stanza) {
                    if (stanza.is('success', NS_XMPP_SASL)) {
                        outStream.startParser();
                        outStream.startStream();
                        outStream.removeListener('stanza', onStanza);
                        var onStream;
                        onStream = function() {
                            outStream.emit('online');
                            outStream.removeListener('streamStart', onStream);
                        };
                        outStream.addListener('streamStart', onStream);
                    } else if (stanza.is('failure', NS_XMPP_SASL))
                        outStream.end();
                };
                outStream.addListener('stanza', onStanza);
                break;

            default:
                outStream.error('undefined-condition',
                                'Cannot authenticate via ' + method);
            }
            outStream.removeListener('auth', onAuth);
        };
        outStream.addListener('auth', onAuth);

        outStream.addListener('online', function() {
            outStream.isAuthed = true;
            if (outStream.queue) {
                outStream.queue.forEach(function(stanza) {
                    outStream.send(stanza);
                });
                delete outStream.queue;
            }
        });

        return outStream;
    }
};

/**
 * Called by router when verification is done
 */
DomainContext.prototype.addInStream = function(srcDomain, stream) {
    var self = this;

    if (this.s2sIn.hasOwnProperty(srcDomain)) {
        // Replace old
        var oldStream = this.s2sIn[srcDomain];
        oldStream.error('conflict', 'Connection replaced');
        delete self.s2sIn[srcDomain];
    }

    this.setupStream(srcDomain, stream);
    stream.isConnected = true;
    stream.isAuthed = true;
    var closeCb = function() {
        if (self.s2sIn[srcDomain] == stream)
            delete self.s2sIn[srcDomain];
    };
    stream.addListener('close', closeCb);
    stream.addListener('error', closeCb);
    this.s2sIn[srcDomain] = stream;
};

DomainContext.prototype.setupStream = function(domain, stream) {
    var self = this;

    stream.addListener('stanza', function(stanza) {
        // Before verified they can send whatever they want
        if (!stream.isAuthed)
            return;

        if (stanza.name !== 'message' &&
            stanza.name !== 'presence' &&
            stanza.name !== 'iq')
            // no normal stanza
            return;


        if (!(typeof stanza.attrs.from === 'string' &&
              typeof stanza.attrs.to === 'string')) {
            stream.error('improper-addressing');
            return;
        }

        // Only accept 'from' attribute JIDs that have the same domain
        // that we validated the stream for
        var fromDomain = (new JID.JID(stanza.attrs.from)).domain;
        if (fromDomain !== domain) {
            stream.error('invalid-from');
            return;
        }

        // Only accept 'to' attribute JIDs to this DomainContext
        var toDomain = (new JID.JID(stanza.attrs.to)).domain;
        if (toDomain !== self.domain) {
            stream.error('improper-addressing');
            return;
        }

        self.receive(stanza);
    });
};

// we want to get our outgoing connection verified, sends <db:result/>
DomainContext.prototype.startDialback = function(destDomain, outStream) {
    outStream.dbKey = generateKey();
    outStream.send(Server.dialbackKey(this.domain, destDomain, outStream.dbKey));

    var self = this;
    var onResult = function(from, to, isValid) {
        if (from != destDomain ||
            to != self.domain)
            // not for us
            return;

        outStream.removeListener('dialbackResult', onResult);
        if (isValid) {
            outStream.emit('online');
        } else {
            // we cannot do anything else with this stream that
            // failed dialback
            outStream.end();
        }
    };
    outStream.addListener('dialbackResult', onResult);
};

// incoming verification request for our outgoing connection that came
// in via an inbound server connection
DomainContext.prototype.verifyDialback = function(domain, id, key, cb) {
    var self = this;
    var outStream;
    if (this.s2sOut.hasOwnProperty(domain) &&
        (outStream = this.s2sOut[domain])) {

        if (outStream.isConnected) {
            var isValid = outStream.streamAttrs.id === id &&
                              outStream.dbKey === key;
            cb(isValid);
        } else {
            // Not online, wait for outStream.streamAttrs
            // (they may have our stream header & dialback key, but
            // our slow connection hasn't received their stream
            // header)
            outStream.addListener('online', function() {
                                      // recurse
                                      self.verifyDialback(domain, id, key, cb);
                                  });
            outStream.addListener('close', function() {
                                      cb(false);
                                  });
        }
    } else
        cb(false);
};

DomainContext.prototype.verifyIncoming = function(fromDomain, inStream, dbKey) {
    var self = this;
    var outStream = this.sendRaw(Server.dialbackVerify(this.domain, fromDomain,
                                                       inStream.streamId, dbKey),
                                 fromDomain);

    // these are needed before for removeListener()
    var onVerified = function(from, to, id, isValid) {
	from = nameprep(from);
	to = nameprep(to);
        if (from !== fromDomain ||
            to !== self.domain ||
            id != inStream.streamId)
            // not for us
            return;

        // tell them about it
        inStream.send(Server.dialbackResult(to, from, isValid));

        if (isValid) {
            // finally validated them!
            self.addInStream(from, inStream);
        } else {
            // the connection isn't used for another domain, so
            // closing is safe
            inStream.send('</stream:stream>');
            inStream.end();
        }

        rmCbs();
    };
    var onClose = function() {
        // outgoing connection didn't work out, tell the incoming
        // connection
        inStream.send(Server.dialbackResult(self.domain, fromDomain, false));

        rmCbs();
    };
    var onCloseIn = function() {
        // t'was the incoming stream that wanted to get
        // verified, nothing to do remains

        rmCbs();
    };
    var rmCbs = function() {
        outStream.removeListener('dialbackVerified', onVerified);
        outStream.removeListener('close', onClose);
        inStream.removeListener('close', onCloseIn);
    };
    outStream.addListener('dialbackVerified', onVerified);
    outStream.addListener('close', onClose);
    inStream.addListener('close', onCloseIn);

};

DomainContext.prototype.receive = function(stanza) {
    if (this.stanzaListener)
        this.stanzaListener(stanza);
};

DomainContext.prototype.end = function() {
    var shutdown = function(conns) {
        for(var domain in conns)
            if (conns.hasOwnProperty(domain))
                conns[domain].end();
    };
    shutdown(this.s2sOut);
    shutdown(this.s2sIn);
};

/**
 * Accepts incoming S2S connections. Handles routing of outgoing
 * stanzas, and allows you to register a handler for your own domain.
 *
 * TODO:
 * * Incoming SASL EXTERNAL with certificate validation
 */
function Router(s2sPort, bindAddress) {
    var self = this;
    this.ctxs = {};

    net.createServer(function(inStream) {
        self.acceptConnection(inStream);
    }).listen(s2sPort || 5269, bindAddress || '::');
}
exports.Router = Router;

// Defaults
Router.prototype.rateLimit = 100;  // 100 KB/s, it's S2S after all
Router.prototype.maxStanzaSize = 65536;  // 64 KB, by convention
Router.prototype.keepAlive = 30 * 1000;  // 30s
Router.prototype.streamTimeout = 5 * 60 * 1000;  // 5min
Router.prototype.credentials = {};  // TLS credentials per domain

// little helper, because dealing with crypto & fs gets unwieldy
Router.prototype.loadCredentials = function(domain, keyPath, certPath) {
    var crypto = require('crypto');
    var fs = require('fs');

    var key = fs.readFileSync(keyPath, 'ascii');
    var cert = fs.readFileSync(certPath, 'ascii');

    var creds = crypto.createCredentials({ key: key, cert: cert });

    this.credentials[domain] = creds;
};

Router.prototype.acceptConnection = function(socket) {
    var self = this;

    var inStream = new Server.IncomingServer(socket, this.credentials);
    this.setupStream(inStream);

    // Unhandled 'error' events will trigger exceptions, don't let
    // that happen:
    socket.addListener('error', function() { });
    inStream.addListener('error', function() { });

    // incoming server wants to verify an outgoing connection of ours
    inStream.addListener('dialbackVerify', function(from, to, id, key) {
        from = nameprep(from);
	to = nameprep(to);
        if (self.hasContext(to)) {
            self.getContext(to).verifyDialback(from, id, key, function(isValid) {
                // look if this was a connection of ours
                inStream.send(Server.dialbackVerified(to, from, id, isValid));
            });
        } else
            // we don't host the 'to' domain
            inStream.send(Server.dialbackVerified(to, from, id, false));
    });
    // incoming connection wants to get verified
    inStream.addListener('dialbackKey', function(from, to, key) {
        from = nameprep(from);
        to = nameprep(to);
        if (self.hasContext(to)) {
            // trigger verification via outgoing connection
            self.getContext(to).verifyIncoming(from, inStream, key);
        } else {
            inStream.error('host-unknown', to + ' is not served here');
        }
    });
};

Router.prototype.setupStream = function(stream) {
    stream.maxStanzaSize = this.maxStanzaSize;
    StreamShaper.attach(stream.socket, this.rateLimit);
    stream.socket.setKeepAlive(true, this.keepAlive);
    IdleTimeout.attach(stream.socket, this.streamTimeout);
    stream.socket.addListener('timeout', function() {
        stream.error('connection-timeout');
    });
};

/**
 * Create domain context & register a stanza listener callback
 */
Router.prototype.register = function(domain, listener) {
    domain = nameprep(domain);
    this.getContext(domain).stanzaListener = listener;
};

/**
 * Unregister a context and stop its connections
 */
Router.prototype.unregister = function(domain) {
    if (this.hasContext(domain)) {
        this.ctxs[domain].end();

        delete this.ctxs[domain];
    }
};

Router.prototype.send = function(stanza) {
    if (stanza.root)
        stanza = stanza.root();

    var to = stanza.attrs && stanza.attrs.to;
    var toDomain = to && (new JID.JID(to)).domain;
    if (toDomain && this.hasContext(toDomain)) {
        // inner routing
        this.getContext(toDomain).receive(stanza);
    } else if (stanza.attrs && stanza.attrs.from) {
        // route to domain context for s2s
        var domain = (new JID.JID(stanza.attrs.from)).domain;
        this.getContext(domain).send(stanza);
    } else
        throw 'Sending stanza from a domain we do not host';
};

Router.prototype.hasContext = function(domain) {
    return this.ctxs.hasOwnProperty(domain);
};

Router.prototype.getContext = function(domain) {
    if (this.ctxs.hasOwnProperty(domain))
        return this.ctxs[domain];
    else
        return (this.ctxs[domain] = new DomainContext(this, domain));
};


/**
 * TODO: According to XEP-0185 we should hash from, to & streamId
 */
function generateKey() {
    var r = new Buffer(16);
    for(var i = 0; i < r.length; i++) {
        r[i] = 48 + Math.floor(Math.random() * 10);  // '0'..'9'
    }
    return r.toString();
}
