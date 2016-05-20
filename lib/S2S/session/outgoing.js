'use strict'

var util = require('util')
var SRV = require('node-xmpp-core').SRV
var Connection = require('node-xmpp-core').Connection
var Server = require('./server')
var debug = require('debug')('xmpp:s2s:outserver')
var NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl'

var OutgoingServer = function (srcDomain, destDomain, credentials) {
  debug(util.format('establish an outgoing S2S connection from %s to %s', srcDomain, destDomain))

  this.streamId = null

  var streamAttrs = {
    version: '1.0',
    from: srcDomain
  }

  this.streamTo = destDomain

  // For outgoing, we only need our own cert & key
  this.credentials = credentials

  // No credentials means we cannot <starttls/> on the server
  // side. Unfortunately this is required for XMPP 1.0.
  if (!this.credentials) {
    delete this.xmppVersion
    this.allowTLS = false
  }

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

function hasSASLExternal (stanza) {
  var mechanisms = stanza.getChild('mechanisms', NS_XMPP_SASL)
  if (mechanisms) {
    var mechanism = mechanisms.getChild('mechanism')
    return mechanism && mechanism.text() === 'EXTERNAL'
  }
  return false
}

// overwrite onStanza from Server
OutgoingServer.prototype.onStanza = function (stanza) {
  debug('recieved stanza' + stanza.toString())
  var handled = Server.prototype.onStanza.call(this, stanza)

  if (!handled) {
    if (stanza.is('features', Connection.NS_STREAM)) {
      debug('send features')
      if (hasSASLExternal(stanza)) {
        this.emit('auth', 'external')
      } else {
        this.emit('auth', 'dialback')
      }
    } else {
      this.emit('stanza', stanza)
    }

    this.handleDialback(stanza)
  }
}

module.exports = OutgoingServer
