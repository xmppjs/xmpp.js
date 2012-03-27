var EventEmitter = require('events').EventEmitter;
var util = require('util');
var ltx = require('ltx');
var BOSH = require('./bosh');

function BOSHServer() {
    this.sessions = {};
}

util.inherits(BOSHServer, EventEmitter);
exports.BOSHServer = BOSHServer;

/**
 * *YOU* need to check the path before passing to this function.
 */
BOSHServer.prototype.handleHTTP = function(req, res) {
    var that = this;

    if (req.method === 'POST') {
	BOSH.parseBody(req, function(error, bodyEl) {
	    if (error || !bodyEl || !bodyEl.attrs) {
		res.writeHead(400, { 'Content-Type': "text/plain" });
		res.end(error.message || error.stack || "Error");
		return;
	    }

	    var session, sid = bodyEl.attrs.sid;
	    if (sid) {
		session = that.sessions[sid];
		if (session) {
		    session.handleHTTP({ req: req, res: res, bodyEl: bodyEl });
		} else {
		    res.writeHead(404, { 'Content-Type': "text/plain" });
		    res.end("BOSH session not found");
		}
	    } else {
		/* No sid: create session */
		do {
		    session = new BOSHServerSession({ req: req, res: res, bodyEl: bodyEl });
		} while(that.sessions.hasOwnProperty(session.sid));
		that.sessions[session.sid] = session;
		/* Hook for destruction */
		session.on('close', function() {
		    delete that.sessions[session.sid];
		});
		that.emit('connect', session);
	    }
	});
    } else if (false && req.method === 'PROPFIND') {
	/* TODO */
    } else {
	res.writeHead(400);
	res.end();
    }
};

function generateSid() {
    var sid = "";
    for(var i = 0; i < 32; i++) {
	sid += String.fromCharCode(48 + Math.floor(Math.random() * 10));
    }
    return sid;
}

function BOSHServerSession(opts) {
    this.xmlnsAttrs = {
	xmlns: "http://jabber.org/protocol/httpbind",
	'xmlns:xmpp': "urn:xmpp:xbosh",
	'xmlns:stream': "http://etherx.jabber.org/streams"
    };
    if (opts.xmlns)
	for(var prefix in opts.xmlns)
	    if (prefix)
		this.xmlnsAttrs["xmlns:" + prefix] = opts.xmlns[prefix];
	    else
		this.xmlnsAttrs["xmlns"] = opts.xmlns[prefix];
    this.streamAttrs = opts.streamAttrs || {};
    this.handshakeAttrs = opts.bodyEl.attrs;

    this.sid = generateSid();
    this.nextRid = parseInt(opts.bodyEl.attrs.rid, 10) + 1;
    this.inQueue = {};
    this.outQueue = [];
    this.stanzaQueue = [];

    this.respond(opts.res, { sid: this.sid });

    // Let someone hook to 'connect' event first
    process.nextTick(this.startParser.bind(this));
}
util.inherits(BOSHServerSession, EventEmitter);

/* Should cause <stream:features/> to be sent. */
BOSHServerSession.prototype.startParser = function() {
    this.emit('streamStart', this.handshakeAttrs);
};

BOSHServerSession.prototype.handleHTTP = function(opts) {
    if (this.inQueue.hasOwnProperty(opts.bodyEl.attrs.rid))
	throw 'TODO';

    this.inQueue[opts.bodyEl.attrs.rid] = opts;
    this.workInQueue();
};

BOSHServerSession.prototype.workInQueue = function() {
    if (!this.inQueue.hasOwnProperty(this.nextRid))
	// Still waiting for next rid request
	return;

    var that = this;
    var opts = this.inQueue[this.nextRid];
    delete this.inQueue[this.nextRid];
    this.nextRid++;

    opts.bodyEl.children.forEach(function(stanza) {
	that.emit('stanza', stanza);
    });

    this.outQueue.push(opts);

    process.nextTick(function() {
	that.workOutQueue();
	that.workInQueue();
    });
};

BOSHServerSession.prototype.workOutQueue = function() {
    if (this.stanzaQueue.length < 1 || this.outQueue.length < 1)
	return;

    var stanzas = this.stanzaQueue;
    this.stanzaQueue = [];
    var opts = this.outQueue.shift();

    this.respond(opts.res, {}, stanzas);
};

BOSHServerSession.prototype.send = function(stanza) {
    console.log("Q", stanza.root().toString());
    this.stanzaQueue.push(stanza.root());

    var that = this;
    process.nextTick(function() {
	that.workOutQueue();
    });
};

BOSHServerSession.prototype.respond = function(res, attrs, children) {
    res.writeHead(200, { 'Content-Type': "application/xml; charset=utf-8" });
    for(var k in this.xmlnsAttrs)
	attrs[k] = this.xmlnsAttrs[k];
    var bodyEl = new ltx.Element('body', attrs);
    if (children)
	children.forEach(bodyEl.cnode.bind(bodyEl));
    console.log(">> ", bodyEl.toString());
    bodyEl.write(function(s) {
	res.write(s);
    });
    res.end();
};
