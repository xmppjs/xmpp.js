var Connection = require('./connection');
var JID = require('./jid').JID;
var ltx = require('ltx');
var util = require('util');
var crypto = require('crypto');
var SRV = require('./srv');

var NS_COMPONENT = 'jabber:component:accept';

/**
 * params:
 *   jid: String (required)
 *   password: String (required)
 *   host: String (required)
 *   port: Number (required)
 *   reconnect: Boolean (optional)
 */
function Component(params) {
    var self = this;
    Connection.Connection.call(this);

    if (typeof params.jid == 'string')
        this.jid = new JID(params.jid);
    else
        this.jid = params.jid;
    this.password = params.password;
    this.xmlns[''] = NS_COMPONENT;
    this.streamTo = this.jid.domain;

    this.addListener('streamStart', function(streamAttrs) {
        self.onStreamStart(streamAttrs);
    });
    this.addListener('rawStanza', function(stanza) {
        self.onRawStanza(stanza);
    });

    var connect = function() {
	var attempt = SRV.connect(self.socket, [], params.host, params.port);
	attempt.addListener('connect', function() {
	    self.startParser();
	    self.startStream();
	});
	attempt.addListener('error', function(e) {
	    self.emit('error', e);
	});
    };
    if (params.reconnect)
	this.reconnect = connect;
    connect();
}

util.inherits(Component, Connection.Connection);
exports.Component = Component;

Component.prototype.onStreamStart = function(streamAttrs) {
    var digest = sha1_hex(streamAttrs.id + this.password);
    this.send(new ltx.Element('handshake').t(digest));
};

Component.prototype.onRawStanza = function(stanza) {
    if (stanza.is('handshake')) {
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
