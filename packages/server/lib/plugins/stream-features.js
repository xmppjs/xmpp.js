'use strict'

/**
 * References
 * https://xmpp.org/rfcs/rfc6120.html#streams-negotiation Stream Negotiation
 * https://xmpp.org/extensions/xep-0170.html XEP-0170: Recommended Order of Stream Feature Negotiation
 * https://xmpp.org/registrar/stream-features.html XML Stream Features
 */

const { Element } = require('ltx')
const plugin = require('@xmpp/plugin')

const NS_STREAMS = 'http://etherx.jabber.org/streams'

module.exports = plugin('stream-features', {
  start() {
    this.features = []

    const { entity } = this
    this.handler = () => {
      const features = new Element(
        'stream:features',
        { xmlns: NS_STREAMS, 'xmlns:stream': NS_STREAMS }
      )
      this.features.forEach(({ name, xmlns, match, cb }) => {
        if (!match || match(entity)) {
          const feature = features.c(name, { xmlns })
          if (cb) cb(feature)
        }
      })
      entity.send(features)
    }

    entity.on('open', this.handler)
  },

  stop() {
    delete this.features
    this.entity.off('open', this.handler)
    delete this.handler
  },

  add({ name, xmlns, match, cb }) {
    this.features.push({ name, xmlns, match, cb })
  },
})
