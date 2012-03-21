var EventEmitter = require('events').EventEmitter;
var util = require('util');
var request = require('request');


function BOSHConnection(opts) {
    EventEmitter.call(this);

    this.boshURL = opts.boshURL;
    this.queue = [];

    this.request({
	to: this.to,
	from: undefined,
	route: "xmpp:",
	ver: "1.6",
	wait: "10",
	hold: "1",
	content: this.contentType
    }, [], function(err, response) {
    });
}
util.inherits(BOSHConnection, EventEmitter);

BOSHConnection.prototype.contentType = "text/xml; charset=utf-8";
BOSHConnection.prototype.xmlnsAttrs = {
    xmlns: "http://jabber.org/protocol/httpbind",
    'xmlns:xmpp': "urn:xmpp:xbosh",
    'xmlns:stream': "http://etherx.jabber.org/streams"
};

BOSHConnection.prototype.send = function(stanza) {
    this.queue.push({ stanza: stanza });
    this.maySend();
};

BOSHConnection.prototype.maySend = function() {
};

BOSHConnection.prototype.request = function(attrs, children, cb) {
    for(var k in this.xmlnsAttrs)
	attrs[k] = this.xmlnsAttrs[k];
    var boshEl = new Element('body', attrs);
    for(var i = 0; i < children.length; i++)
	boshEl.cnode(children[i]);

    var req = request({
	uri: this.boshURL,
	method: 'POST',
	headers: {
	    "Content-Type": this.contentType
	},
	body: boshEl.toString()
    });
    req.on('data', function(data) {
	console.log("req data", data);
    });
    req.on('end', function() {
	console.log("req end");
    });
    req.on('error', function(e) {
	console.log("req error", e);
    });
};
