'use strict'

const Connection = require('@xmpp/connection')
const Server = require('./server')
const debug = require('debug')('xmpp:s2s:outserver')
const NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl'

class OutgoingServer extends Server {
  constructor(srcDomain, destDomain, credentials) {
    debug(`establish an outgoing S2S connection from ${srcDomain} to ${destDomain}`)

    const streamAttrs = {
      version: '1.0',
      from: srcDomain,
    }

    super({ streamAttrs })

    this.streamId = null

    this.streamTo = destDomain

    // For outgoing, we only need our own cert & key
    this.credentials = credentials

    // No credentials means we cannot <starttls/> on the server
    // side. Unfortunately this is required for XMPP 1.0.
    if (!this.credentials) {
      delete this.xmppVersion
      this.allowTLS = false
    }

    this.on('streamStart', function ({ id }) {
      // Extract stream id
      this.streamId = id
    })

    // Establish connection
    this.listen({
      socket: SRV.connect({
        services: ['_xmpp-server._tcp', '_jabber._tcp'],
        domain: destDomain,
        defaultPort: 5269,
      }),
    })
  }

  // Overwrite onStanza from Server
  onStanza(stanza) {
    debug(`recieved stanza: ${stanza.toString()}`)
    const handled = Server.prototype.onStanza.call(this, stanza)

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
}

function hasSASLExternal(stanza) {
  const mechanisms = stanza.getChild('mechanisms', NS_XMPP_SASL)
  if (mechanisms) {
    const mechanism = mechanisms.getChild('mechanism')
    return mechanism && mechanism.text() === 'EXTERNAL'
  }
  return false
}

module.exports = OutgoingServer
