'use strict';

var util = require('util'),
    hat = require('hat'),
    ltx = require('ltx'),
    Connection = require('node-xmpp-core').Connection,
    Server = require('./server')

var debug = require('debug')('inserver')

/**
 * Accepts incomming server-to-server connections
 */
var IncomingServer = function(opts, credentials) {
    debug('IncomingServer');
    var self = this;

    //this.generateId = hat.rack(opts.sidBits, opts.sidBitsBase, opts.sidBitsExpandBy)
    this.streamId = this.generateId().toString();
    
    opts = opts || {}
    var streamAttrs = {};
    streamAttrs.version = '1.0'
    streamAttrs.id = this.streamId;
    opts.streamAttrs = streamAttrs;

    Server.call(this, opts)

    this.on('streamStart', function(attrs) {
        debug('streamStart')

        if (attrs.to &&
            credentials &&
            credentials.hasOwnProperty(attrs.to)) {
            // TLS cert & key for this domain
            self.credentials = credentials[attrs.to]
        }
        // No credentials means we cannot <starttls/> on the server
        // side. Unfortunately this is required for XMPP 1.0.
        if (!self.credentials) delete self.xmppVersion
        self.startStream()
    })
    this.on('stanza', function(stanza) {
        debug('stanza' + stanza.toString())
        if (stanza.is('starttls', Connection.NS_XMPP_TLS)) {
            self.send(new ltx.Element('proceed', {
                xmlns: Connection.NS_XMPP_TLS
            }))
            self.setSecure(this.credentials, true)
        }
        self.handleDialback(stanza);
    })

    return this
}

util.inherits(IncomingServer, Server)

IncomingServer.prototype.startStream = function() {
    debug('startStream')
    Server.prototype.startStream.call(this)

    if (this.xmppVersion === '1.0') {
        this.send('<stream:features>')
        if (this.credentials && !this.isSecure) {
            this.send('<starttls xmlns=\'' + Connection.NS_XMPP_TLS + '\'/>')
        }
        this.send('</stream:features>')
    }
}

module.exports = IncomingServer;