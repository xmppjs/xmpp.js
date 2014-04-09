'use strict';

var util = require('util')
  , crypto = require('crypto')
  , EventEmitter = require('events').EventEmitter
  , Connection = require('node-xmpp-core').Connection
  , JID = require('node-xmpp-core').JID
  , SRV = require('node-xmpp-core').SRV
  , ltx = require('node-xmpp-core').ltx

/**
 * opts:
 *   jid: String (required)
 *   password: String (required)
 *   host: String (required)
 *   port: Number (required)
 *   reconnect: Boolean (optional)
 */
function Component(opts) {
    EventEmitter.call(this)
    var self = this
    var conn = this.connection = new Connection(opts)
    this._addConnectionListeners()

    if (typeof opts.jid === 'string') {
        this.connection.jid = new JID(opts.jid)
    } else {
        this.connection.jid = opts.jid
    }
    this.connection.password = opts.password
    this.connection.xmlns[''] = this.NS_COMPONENT
    this.connection.xmlns['stream'] = this.NS_STREAM
    this.connection.streamTo = this.connection.jid.domain

    this.connection.listen({
        socket:SRV.connect({
            services:    [],
            domain:      opts.host,
            defaultPort: opts.port,
            socket:      opts.socket
        })
    })

}

util.inherits(Component, EventEmitter)

Component.prototype.NS_COMPONENT = 'jabber:component:accept'
Component.prototype.NS_STREAM = 'http://etherx.jabber.org/streams'

Component.prototype.onStreamStart = function(streamAttrs) {
    var digest = this._sha1Hex(streamAttrs.id + this.connection.password)
    this.connection.send(new ltx.Element('handshake').t(digest))
}

Component.prototype.onStanza = function(stanza) {
    if (stanza.is('handshake')) {
        this.emit('online')
        return
    }
    this.emit('stanza', stanza)
}

Component.prototype.send = function(stanza) {
    this.connection.send(stanza)
}

Component.prototype.end = function() {
    this.connection.end()
}

Component.prototype._addConnectionListeners = function (con) {
    con = con || this.connection
    con.on('streamStart', this.onStreamStart.bind(this))
    con.on('stanza', this.onStanza.bind(this))
    con.on('drain', this.emit.bind(this, 'drain'))
    con.on('data', this.emit.bind(this, 'data'))
    con.on('end', this.emit.bind(this, 'end'))
    con.on('close', this.emit.bind(this, 'close'))
    con.on('error', this.emit.bind(this, 'error'))
    con.on('connect', this.emit.bind(this, 'connect'))
    con.on('reconnect', this.emit.bind(this, 'reconnect'))
    con.on('disconnect', this.emit.bind(this, 'disconnect'))
    con.on('disconnect', this.emit.bind(this, 'offline'))
    if (con.startStream) {
        con.on('connect', function() {
            // Components start <stream:stream>, servers reply
            con.startStream()
        })
    }
}

Component.prototype._sha1Hex = function(s) {
    var hash = crypto.createHash('sha1')
    hash.update(s)
    return hash.digest('hex')
}

Component.Component = Component
module.exports = Component
