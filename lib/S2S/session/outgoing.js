'use strict'

var util = require('util')
var SRV = require('node-xmpp-core').SRV
var Connection = require('node-xmpp-core').Connection
var Server = require('./server')
var debug = require('debug')('xmpp:s2s:outserver')

var OutgoingServer = function (srcDomain, destDomain, credentials) {
  debug(util.format('establish an outgoing S2S connection from %s to %s', srcDomain, destDomain))

  this.streamId = null

  var streamAttrs = {}
  streamAttrs.version = '1.0'

  this.streamTo = destDomain

  // For outgoing, we only need our own cert & key
  this.credentials = credentials

  // No credentials means we cannot <starttls/> on the server
  // side. Unfortunately this is required for XMPP 1.0.
  if (!this.credentials) {
    delete this.xmppVersion
    this.allowTLS = false
  }

  this.on('connection', function () {
    this.socket.on('secure', function () {
      debug('connected to remote server: ' + this.streamTo)
      this.startStream()
    }.bind(this))
  })

  this.on('streamStart', function (attrs) {
    // extract stream id
    this.streamId = attrs.id
  })

  Server.call(this, {streamAttrs: streamAttrs})

  // establish connection
  this.listen({
    socket: SRV.connect({
      services: ['_xmpp-server._tcp', '_jabber._tcp'],
      domain: destDomain,
      defaultPort: 5269
    })
  })
}

util.inherits(OutgoingServer, Server)

// overwrite onStanza from Server
OutgoingServer.prototype.onStanza = function (stanza) {
  debug('recieved stanza' + stanza.toString())
  var handled = Server.prototype.onStanza.call(this, stanza)

  if (!handled) {
    if (stanza.is('features', Connection.NS_STREAM)) {
      debug('send features')
      this.emit('auth', 'dialback')
    }

    this.handleDialback(stanza)
  }
}

module.exports = OutgoingServer
