'use strict';

var util = require('util')
  , ltx = require('ltx')
  , Connection = require('node-xmpp-core').Connection
  , debug = require('debug')('xmpp:s2s:inserver')
  , Server = require('./server')

/**
 * Accepts incomming server-to-server connections
 */
var IncomingServer = function(opts, credentials) {
    debug('start a new incoming server connection')

    this.streamId = this.generateId().toString()
    
    opts = opts || {}
    var streamAttrs = {}
    streamAttrs.version = '1.0'
    streamAttrs.id = this.streamId
    opts.streamAttrs = streamAttrs

    Server.call(this, opts)

    this.on('streamStart', function(attrs) {
        debug('start a stream')

        if (attrs.to &&
            credentials &&
            credentials.hasOwnProperty(attrs.to)) {
            // TLS cert & key for this domain
            this.credentials = credentials[attrs.to]
        }
        // No credentials means we cannot <starttls/> on the server
        // side. Unfortunately this is required for XMPP 1.0.
        if (!this.credentials) delete this.xmppVersion
        this.startStream()
    })
    this.on('stanza', function(stanza) {
        debug('stanza: ' + stanza.toString())
        if (stanza.is('starttls', Connection.NS_XMPP_TLS)) {
            this.send(new ltx.Element('proceed', {
                xmlns: Connection.NS_XMPP_TLS
            }))
            this.setSecure(this.credentials, true)
        }
        this.handleDialback(stanza)
    })

    return this
}

util.inherits(IncomingServer, Server)

IncomingServer.prototype.startStream = function() {
    // call parent implementation
    Server.prototype.startStream.call(this)

    if (this.xmppVersion === '1.0') {
        this.send('<stream:features>')
        if (this.credentials && !this.isSecure) {
            this.send('<starttls xmlns=\'' + Connection.NS_XMPP_TLS + '\'/>')
        }
        this.send('</stream:features>')
    }
}

module.exports = IncomingServer
