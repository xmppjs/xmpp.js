'use strict'

var util = require('util')
var crypto = require('crypto')
var EventEmitter = require('events').EventEmitter
var Connection = require('node-xmpp-core').Connection
var JID = require('node-xmpp-core').JID
var Element = require('node-xmpp-core').Element

function ComponentSession (opts) {
  EventEmitter.call(this)
  this.connection = opts.connection || new Connection()
  this._addConnectionListeners()
  this.connection.xmlns[''] = this.NS_COMPONENT
  this.connection.xmlns.stream = this.NS_STREAM
  if (this.connection.connect) {
    this.connection.connect({socket: opts.socket})
  }
}

util.inherits(ComponentSession, EventEmitter)

ComponentSession.prototype.NS_COMPONENT = 'jabber:component:accept'
ComponentSession.prototype.NS_STREAM = 'http://etherx.jabber.org/streams'

ComponentSession.prototype.onStreamStart = function (streamAttrs) {
  var self = this
  this.jid = new JID(streamAttrs.to)
  this.emit('verify-component', this.jid, function (err, password) {
    if (err) {
      self.connection.send(new Element('host-unknown'))
      self.connection.end()
    } else {
      if (!streamAttrs.id) streamAttrs.id = Date.now()
      self.expectedDigest = self._sha1Hex((streamAttrs.id || '') + password)
      self.connection.streamAttrs = streamAttrs
      self.connection.startStream()
    }
  })
}

ComponentSession.prototype.onStanza = function (stanza) {
  if (!stanza.is('handshake')) {
    this.emit('stanza', stanza)
    return
  }

  if (stanza.getText() === this.expectedDigest) {
    this.emit('auth-success')
    this.connection.send(new Element('handshake'))
    this.emit('online')
    this.authenticated = true
  } else {
    // Per XEP-0114 DO NOT return any errors, just close the connection
    this.end()
  }
}

ComponentSession.prototype.send = function (stanza) {
  this.connection.send(stanza)
}

ComponentSession.prototype.end = function () {
  this.connection.end()
}

ComponentSession.prototype._addConnectionListeners = function (con) {
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
}

ComponentSession.prototype._sha1Hex = function (s) {
  var hash = crypto.createHash('sha1')
  hash.update(s)
  return hash.digest('hex')
}

module.exports = ComponentSession
