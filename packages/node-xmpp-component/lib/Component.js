'use strict'

var util = require('util')
var crypto = require('crypto')
var EventEmitter = require('events').EventEmitter
var Connection = require('node-xmpp-core').Connection
var JID = require('node-xmpp-core').JID
var SRV = require('node-xmpp-core').SRV
var Element = require('node-xmpp-core').Element

/**
 * opts:
 *   jid: String (required)
 *   password: String (required)
 *   host: String (required)
 *   port: Number (required)
 *   reconnect: Boolean (optional)
 */
function Component (opts) {
  EventEmitter.call(this)
  var conn = this.connection = new Connection(opts)
  this._addConnectionListeners()

  if (typeof opts.jid === 'string') {
    conn.jid = new JID(opts.jid)
  } else {
    conn.jid = opts.jid
  }
  conn.password = opts.password
  conn.xmlns[''] = this.NS_COMPONENT
  conn.xmlns['stream'] = this.NS_STREAM
  conn.streamTo = this.connection.jid.domain

  conn.listen({
    socket: SRV.connect({
      services: [],
      domain: opts.host,
      defaultPort: opts.port,
      socket: opts.socket
    })
  })
}

util.inherits(Component, EventEmitter)

Component.prototype.NS_COMPONENT = 'jabber:component:accept'
Component.prototype.NS_STREAM = 'http://etherx.jabber.org/streams'

Component.prototype.onStreamStart = function (streamAttrs) {
  var digest = this._sha1Hex(streamAttrs.id + this.connection.password)
  this.connection.send(new Element('handshake').t(digest))
}

Component.prototype.onStanza = function (stanza) {
  if (stanza.is('handshake')) {
    this.emit('online')
    return
  }
  this.emit('stanza', stanza)
}

Component.prototype.send = function (stanza) {
  // TODO node-xmpp-core Connection should probably do this
  // and always add from attribute to outgoing stanzas if absent
  if (!stanza.attrs.from) {
    stanza.attrs.from = this.connection.jid.toString()
  }
  this.connection.send(stanza)
}

Component.prototype.end = function () {
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
    con.on('connect', function () {
      // Components start <stream:stream>, servers reply
      con.startStream()
    })
  }
}

Component.prototype._sha1Hex = function (s) {
  var hash = crypto.createHash('sha1')
  hash.update(s, 'binary')
  return hash.digest('hex')
}

module.exports = Component
