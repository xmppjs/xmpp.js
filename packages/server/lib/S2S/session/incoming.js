'use strict'

const util = require('util')
const Element = require('node-xmpp-core').Element
const hat = require('hat')
const debug = require('debug')('xmpp:s2s:inserver')
const Server = require('./server')

const NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl'

/**
 * Accepts incomming server-to-server connections
 */
class IncomingServer extends Server {
  constructor(opts) {
    debug('start a new incoming server connection')

    opts = opts || {}

    this.streamId = opts.streamId || hat(opts.sidBits, opts.sidBitsBase)

    const streamAttrs = {}
    streamAttrs.version = '1.0'
    streamAttrs.id = this.streamId
    opts.streamAttrs = streamAttrs

    // TLS is activated in domaincontext.

    super(opts)

    this.connect({socket: opts.socket})

    return this
  }

  handleTlsNegotiation(stanza) {
    if (stanza.is('starttls', this.NS_XMPP_TLS)) {
      this.send(new Element('proceed', {
        xmlns: this.NS_XMPP_TLS,
      }))
      this.setSecure(this.credentials, true, this.fromDomain)
      return true
    }
    return false
  }

  // Overwrite onStanza from Server
  onStanza(stanza) {
    const handled = [
      Server.prototype.onStanza,
      this.handleTlsNegotiation,
      this.handleDialback,
      this.handleSASLExternal,
    ].some(function (stanzaHandler) {
      return stanzaHandler.call(this, stanza)
    }, this)

    // Emit stanza if it is not handled
    if (!handled) {
      this.emit('stanza', stanza)
    }
  }

  verifyCertificate() {
    // Authorized ?
    const socket = this.socket
    if (!socket.authorized) {
      debug('certificate authorization failed: ' + socket.authorizationError)
      return this.sendNotAuthorizedAndClose()
    }

    debug(this.fromDomain + ' authorized')
    this.emit('auth', 'SASL')
  }

  onSASLAuth() {
    this.send(new Element('success', {
      xmlns: NS_XMPP_SASL,
    }))
    this.streamStart()
  }

  handleSASLExternal(stanza) {
    const self = this
    if (this.isSecure && isSASLExternal(stanza)) {
      debug('Auth using SASL EXTERNAL')

      const certificate = this.socket.getPeerCertificate()

      if (isEmptyCertificate(certificate)) {
        debug('Empty certificate. Renegotiate for certificate.')
        this.socket.renegotiate({requestCert: true}, (error) => {
          if (error) {
            return self.error('internal-server-error', error)
          }
          self.verifyCertificate()
        })
      } else {
        self.verifyCertificate()
      }
      return true
    }
    return false
  }

  sendNotAuthorizedAndClose() {
    this.send(new Element('failure', {
      xmlns: NS_XMPP_SASL,
    }).c('not-authorized').up()
    )
    this.closeStream()
    this.end()
  }

  sendFeatures() {
    debug('send features')
    const features = new Element('stream:features')
    // TLS
    if (this.opts && this.opts.tls && !this.isSecure) {
      features
        .c('starttls', {
          xmlns: this.NS_XMPP_TLS,
        })
        .c('required')
    } else if (this.isSecure && this.secureDomain && !this.isAuthed) {
      features.c('mechanisms', {
        xmlns: NS_XMPP_SASL,
      })
        .c('mechanism').t('EXTERNAL')
    }
    this.send(features)
  }
}

IncomingServer.NS_XMPP_SASL = NS_XMPP_SASL

function isEmptyCertificate (certificate) {
  return certificate == null || Object.keys(certificate).length === 0
}

function isSASLExternal (stanza) {
  return stanza && stanza.is('auth', NS_XMPP_SASL) && stanza.attrs.mechanism && stanza.attrs.mechanism === 'EXTERNAL'
}

module.exports = IncomingServer
