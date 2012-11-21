var EventEmitter = require('events').EventEmitter;
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
    EventEmitter.call(this);
    var self = this;
    this.connection = new Connection.Connection();

    // proxy the fucntions of the connection instance
    for (var i in this.connection) {
        if (typeof this.connection[i] === 'function') {
            if (!this[i]) { // add to component instance if the function does not exist yet
                this[i] = this.connection[i];        
            }
        }
    }
    
    if (typeof params.jid == 'string')
        this.connection.jid = new JID(params.jid);
    else
        this.connection.jid = params.jid;
    this.connection.password = params.password;
    this.connection.xmlns[''] = NS_COMPONENT;
    this.connection.streamTo = this.connection.jid.domain;

    this.connection.addListener('streamStart', function(streamAttrs) {
        self.onStreamStart(streamAttrs);
    });
    this.connection.addListener('stanza', function(stanza) {
        self.onStanza(stanza);
    });
    this.connection.addListener('error', function(e) {
	    self.emit('error', e);
    });

    var connect = function() {
	var attempt = SRV.connect(self.connection.socket, [], params.host, params.port);
	attempt.addListener('connect', function() {
	    self.connection.startStream();
	});
	attempt.addListener('error', function(e) {
	    self.emit('error', e);
	});
    };
    if (params.reconnect)
	this.connection.reconnect = connect;
    connect();
}

util.inherits(Component, EventEmitter);
exports.Component = Component;

Component.prototype.onStreamStart = function(streamAttrs) {
    var digest = sha1_hex(streamAttrs.id + this.connection.password);
    this.connection.send(new ltx.Element('handshake').t(digest));
};

Component.prototype.onStanza = function(stanza) {
    if (stanza.is('handshake')) {
        this.emit('online');
    } else {
        this.emit('stanza', stanza);
    }
};

// Component.prototype.send = function(stanza) {
//     this.connection.send(stanza);
// }
// 
function sha1_hex(s) {
    var hash = crypto.createHash('sha1');
    hash.update(s);
    return hash.digest('hex');
}
