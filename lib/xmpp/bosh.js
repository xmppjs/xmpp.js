var EventEmitter = require('events').EventEmitter;
var util = require('util');
var request;
if (process.title === 'browser')
    request = require('browser-request');
else {
    var requestPath = 'request';
    request = require(requestPath);
}
var ltx = require('ltx');


function BOSHConnection(opts) {
    var that = this;
    EventEmitter.call(this);

    this.boshURL = opts.boshURL;
    this.jid = opts.jid;
    this.xmlns = {};
    this.currentRequests = 0;
    this.queue = [];
    this.rid = Math.ceil(Math.random() * 9999999999);

    this.request({
	to: this.jid.domain,
	from: this.jid.toString(),
	route: "xmpp:" + this.jid.domain,
	ver: "1.6",
	wait: "10",
	hold: "1",
	content: this.contentType
    }, [], function(err, bodyEl) {
	if (err) {
	    that.emit('error', err);
	} else if (bodyEl && bodyEl.attrs) {
	    that.sid = bodyEl.attrs.sid;
	    that.maxRequests = parseInt(bodyEl.attrs.requests, 10) || 2;
	    that.processResponse(bodyEl);
	}
    });
}
util.inherits(BOSHConnection, EventEmitter);
exports.BOSHConnection = BOSHConnection;

BOSHConnection.prototype.contentType = "text/xml; charset=utf-8";
BOSHConnection.prototype.xmlnsAttrs = {
    xmlns: "http://jabber.org/protocol/httpbind",
    'xmlns:xmpp': "urn:xmpp:xbosh",
    'xmlns:stream': "http://etherx.jabber.org/streams"
};

BOSHConnection.prototype.startStream = function() {
};

BOSHConnection.prototype.send = function(stanza) {
    this.queue.push({ stanza: stanza.tree() });
    this.mayRequest();
};

BOSHConnection.prototype.processResponse = function(bodyEl) {
    if (bodyEl && bodyEl.children) {
	for(var i = 0; i < bodyEl.children.length; i++) {
	    var child = bodyEl.children[i];
	    if (child.name && child.attrs && child.children)
		this.emit('stanza', child);
	}
    }
};

BOSHConnection.prototype.mayRequest = function() {
    var that = this;
    var canRequest =
	this.currentRequests === 0 ||
	(this.queue.length > 0 && this.currentRequests < this.maxRequests);
    console.log("canRequest",canRequest);
    if (!canRequest)
	return;

    var stanzas = this.queue.map(function(queued) {
	return queued.stanza;
    });
    this.queue = [];
    this.request({}, stanzas, function(err, bodyEl) {
	that.processResponse(bodyEl);
    });
};

BOSHConnection.prototype.end = function(stanzas) {
    var that = this;
    stanzas = stanzas || [];
    if (typeof stanzas !== 'array')
	stanzas = [stanzas];
    this.request({ type: 'terminate' }, stanzas, function(err, bodyEl) {
	if (err) {
	    that.emit('error', err);
	} else {
	    that.processResponse(bodyEl);
	    that.emit('end');
	    delete that.sid;
	}
    });
};

BOSHConnection.prototype.request = function(attrs, children, cb) {
    var that = this;

    attrs.rid = this.rid.toString();
    this.rid++;
    if (this.sid)
	attrs.sid = this.sid;

    for(var k in this.xmlnsAttrs)
	attrs[k] = this.xmlnsAttrs[k];
    var boshEl = new ltx.Element('body', attrs);
    for(var i = 0; i < children.length; i++)
	boshEl.cnode(children[i]);

    this.currentRequests++;
    console.log(">>", boshEl.toString());
    var req = request({
	uri: this.boshURL,
	method: 'POST',
	headers: {
	    "Content-Type": this.contentType
	},
	body: boshEl.toString()
    });

    exports.parseBody(req, function(e, bodyEl) {
	if (e)
	    console.error(e.stack || e);
	else
	    process.nextTick(function() {
		that.mayRequest();
	    });

	that.currentRequests--;
	cb(e, bodyEl);
    });
};

exports.parseBody = function(stream, cb) {
    var parser = new ltx.Parser();
    stream.on('data', function(data) {
	parser.write(data);
    });
    stream.on('end', function() {
	parser.end();
    });
    stream.on('error', function(e) {
	cb(e);
    });
    parser.on('tree', function(bodyEl) {
	cb(null, bodyEl);
    });
    parser.on('error', function(e) {
	cb(e);
    });
};
