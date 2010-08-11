var Connection = require('./connection');
var JID = require('./jid').JID;
var xml = require('./xml');
var sys = require('sys');
var crypto = require('crypto');

var NS_COMPONENT = 'jabber:component:accept';

/**
 * params:
 *   jid: String (required)
 *   password: String (required)
 *   host: String (required)
 *   port: Number (required)
 */
function Component(params) {
    Connection.Connection.call(this);

    if (typeof params.jid == 'string')
	this.jid = new JID(params.jid);
    else
	this.jid = params.jid;
    this.password = params.password;
    this.xmlns = NS_COMPONENT;
    this.streamTo = this.jid.domain;
    this.addListener('streamStart', this.onStreamStart);
    this.addListener('rawStanza', this.onRawStanza);
    this.addListener('end', this.onEnd);

    this.connect(params.port, params.host);
}

sys.inherits(Component, Connection.Connection);
exports.Component = Component;

Component.prototype.onEnd = function() {
    this.authenticated = false;
};

Component.prototype.onStreamStart = function(streamAttrs) {
    var digest = sha1_hex(streamAttrs.id + this.password);
    this.send(new xml.Element('handshake').t(digest));
};

Component.prototype.onRawStanza = function(stanza) {
    if (!this.authenticated &&
	stanza.is('handshake', NS_COMPONENT)) {
	this.authenticated = true;
	this.emit('online');
    } else if (this.authenticated) {
	this.emit('stanza', stanza);
    }
};

function sha1_hex(s) {
    var hash = crypto.createHash('sha1');
    hash.update(s);
    return hash.digest('hex');
}
