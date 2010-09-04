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

function DomainContext(domain) {
    this.domain = domain;
    this.s2sIn = {};
    this.s2sOut = {};
}

DomainContext.prototype.getOut = function(domain) {
    var self = this;

    if (this.s2sOut.hasOwnProperty(domain)) {
	return this.s2sOut[domain];
    } else {
	var outStream = this.s2sOut[domain] =
	    Server.makeOutgoingServer(domain);
	dbgStream('outgoing', outStream);
	outStream.dbKey = generateKey();
	outStream.addListener('online', function() {
	    outStream.dialbackKey(self.domain, domain, outStream.dbKey);
	});
	outStream.addListener('dialbackResult', function(from, to, isValid) {
	    console.log({outDialbackResult:arguments});
	    if (isValid) {
		outStream.isValid = true;
		console.log({outStreamQueue:outStream.queue});
		if (outStream.queue) {
		    outStream.queue.forEach(function(stanza) {
			outStream.send(stanza);
		    });
		    delete outStream.queue;
		}
	    } else {
		outStream.emit('error', new Error('Dialback failure'));
	    }
	});
	outStream.addListener('error', function() {
	    // TODO: purge queue
	    delete self.s2sOut[domain];
	});

	return outStream;
    }
};

DomainContext.prototype.send = function(stanza) {
    var self = this;
    // TODO: return on empty to
    var domain = (new JID.JID(stanza.attrs.to)).domain;

    var outStream = this.getOut(domain);
    if (outStream.isValid)
	outStream.send(stanza);
    else {
	outStream.queue = outStream.queue || [];
	outStream.queue.push(stanza);
    }
};

DomainContext.prototype.verifyDialback = function(domain, id, key) {
    var outStream;
    if (this.s2sOut.hasOwnProperty(domain) &&
	(outStream = this.s2sOut[domain])) {

	var isValid = outStream.streamAttrs.id === id &&
	    outStream.dbKey === key;

	outStream.dialbackResult(this.domain, domain, isValid);
	return isValid;
    } else
	return false;
};

/**
 * TODO:
 * * recv stanzas
 * * send on incoming?
 * * karma
 * * nameprep
 * * listening
 * * allow only to hosted domains
 * * timeouts
 */
function Router(s2sPort) {
    var self = this;
    this.ctxs = {};

    net.createServer(function(stream) {
	dbgStream('incoming', stream);
	var domain;
	stream.verifyDialback = function(from, to, id, key) {
	    domain = from;
	    return self.verifyDialback(from, to, id, key);
	};
	Server.makeIncomingServer(stream);
	stream.addListener('dialbackVerify', function(from, to, id, key) {
	    isValid = self.verifyDialback(from, to, id, key);
	    stream.dialbackVerified(to, from, id, isValid);
	});
	stream.addListener('dialbackKey', function(from, to, key) {
	    var outStream = self.getContext(to).getOut(from);
	    var sendVerify = function() {
		outStream.dialbackVerify(to, from, stream.streamId, key);

		var onVerified;
		onVerified = function(from, to, id, isValid) {
		    stream.dialbackResult(to, from, isValid);
		    
		    outStream.removeListener('dialbackVerified', onVerified);
		};
		outStream.addListener('dialbackVerified', onVerified);
	    };
	    if (outStream.writable)
		sendVerify();
	    else {
		var connectHook;
		var connectHook = function() {
		    sendVerify();
		    outStream.removeListener('connect', step);
		};
		outStream.addListener('connect', connectHook);
	    }
	});
    }).listen(s2sPort || 5269);
}
exports.Router = Router;

Router.prototype.send = function(stanza) {
    if (stanza.root)
	stanza = stanza.root();

    console.log({send:stanza});
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
