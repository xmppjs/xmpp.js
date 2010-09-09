var Connection = require('./connection');
var JID = require('./jid').JID;
var xml = require('./xml');
var sys = require('sys');
var crypto = require('crypto');
var SRV = require('./srv');

var NS_COMPONENT = 'jabber:component:accept';

/**
 * params:
 *   jid: String (required)
 *   password: String (required)
 *   host: String (required)
 *   port: Number (required)
 */
function Component(params) {
    var self = this;
    Connection.Connection.call(this);

    if (typeof params.jid == 'string')
	this.jid = new JID(params.jid);
    else
	this.jid = params.jid;
    this.password = params.password;
    this.xmlns = NS_COMPONENT;
    this.streamTo = this.jid.domain;
    // Immediately start stream
    this.socket.addListener('connect', function() {
	self.startStream();
    });
    this.addListener('streamStart', function(streamAttrs) {
	self.onStreamStart(streamAttrs);
    });
    this.addListener('rawStanza', function(stanza) {
	self.onRawStanza(stanza);
    });
    SRV.connect(this.socket, [], params.host, params.port);
}

sys.inherits(Component, Connection.Connection);
exports.Component = Component;

Component.prototype.onStreamStart = function(streamAttrs) {
    var digest = sha1_hex(streamAttrs.id + this.password);
    this.send(new xml.Element('handshake').t(digest));
};

Component.prototype.startStream = function() {
    Connection.Connection.prototype.startStream.call(this);

    var tag = "<stream:stream xmlns='" + this.xmlns +
	"' xmlns:stream='" + Connection.NS_STREAM + "'" +
	" to='" + this.streamTo + "'";
    if (this.xmppVersion)
	tag += " version='" + this.xmppVersion + "'";
    tag += ">";
    this.send(tag);
};

Component.prototype.onRawStanza = function(stanza) {
    if (stanza.is('handshake', NS_COMPONENT)) {
	this.emit('online');
    } else {
	this.emit('stanza', stanza);
    }
};

function sha1_hex(s) {
    var hash = crypto.createHash('sha1');
    hash.update(s);
    return hash.digest('hex');
}
