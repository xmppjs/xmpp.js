'use strict';

var util = require('util')
  , ltx = require('ltx')
  , hat = require('hat')
  , debug = require('debug')('xmpp:s2s:inserver')
  , Server = require('./server')

/**
 * Accepts incomming server-to-server connections
 */
var IncomingServer = function(opts) {
    debug('start a new incoming server connection')

    opts = opts || {}

    this.streamId = opts.streamId || hat(opts.sidBits, opts.sidBitsBase)

    var streamAttrs = {}
    streamAttrs.version = '1.0'
    streamAttrs.id = this.streamId
    opts.streamAttrs = streamAttrs

    // TLS is activated in domaincontext.

    Server.call(this, opts)

    this.connect({socket:opts.socket})

    return this
}

util.inherits(IncomingServer, Server)

IncomingServer.prototype.streamStart = function(attrs) {
    // call parent implementation
    Server.prototype.streamStart.call(this, attrs)

    this.sendFeatures()
}

IncomingServer.prototype.onStanza = function (stanza) {
    debug('recieved stanza' + stanza.toString())
    var handled = Server.prototype.onStanza.call(this, stanza)

    if (!handled) {
        if (stanza.is('starttls', this.NS_XMPP_TLS)) {
            this.send(new ltx.Element('proceed', {
                xmlns: this.NS_XMPP_TLS
            }))
            this.setSecure(this.credentials, true)
        }
        this.handleDialback(stanza)
    }
}

IncomingServer.prototype.sendFeatures = function () {
    debug('send')
    var features = new ltx.Element('stream:features')
    // TLS
    if (this.opts && this.opts.tls && !this.isSecure) {
        features
            .c('starttls', {
                xmlns: this.NS_XMPP_TLS
            })
            .c('required')

    } else {
        features.c('bind', {
            xmlns: this.NS_BIND
        })
        features.c('session', {
            xmlns: this.NS_SESSION
        })
    }
    this.send(features)
}

module.exports = IncomingServer
