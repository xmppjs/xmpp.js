'use strict'

const { Element } = require('ltx')
const plugin = require('@xmpp/plugin')

const NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl'
const NS_SESSION = 'urn:ietf:params:xml:ns:xmpp-session'
const NS_BIND = 'urn:ietf:params:xml:ns:xmpp-bind'
const NS_STREAMS = 'http://etherx.jabber.org/streams'

function sendFeatures() {
  const features = new Element('stream:features', { xmlns: NS_STREAMS, 'xmlns:stream': NS_STREAMS })
  if (this.authenticated) {
    features.c('bind', { xmlns: NS_BIND })
    features.c('session', { xmlns: NS_SESSION })
  } else {
    if (this.server && this.server.availableSaslMechanisms) {
      // TLS
      const opts = this.server.options
      if (opts && opts.tls && !this.connection.isSecure) {
        features
          .c('starttls', { xmlns: this.connection.NS_XMPP_TLS })
          .c('required')
      }
      this.mechanisms = this.server.getSaslMechanisms()
    } else {
      this.mechanisms = []
    }

    const mechanismsEl = features.c(
      'mechanisms', { xmlns: NS_XMPP_SASL })
    this.mechanisms.forEach(({ prototype: { name } }) => {
      mechanismsEl.c('mechanism').t(name)
    })
  }
  this.send(features)
}

module.exports = plugin('features', {
  start() {
    this.entity.on('open', sendFeatures.bind(this.entity))
  },

  stop() {
  },
})
