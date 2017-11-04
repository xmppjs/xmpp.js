// https://tools.ietf.org/html/draft-cridland-xmpp-session-01

'use strict'

const { Element } = require('ltx')
const plugin = require('@xmpp/plugin')
const streamFeatures = require('./stream-features')

const NS_SESSION = 'urn:ietf:params:xml:ns:xmpp-session'

function handler(ctx) {
  const { entity, id } = ctx
  const { authenticated, jid } = entity

  if (authenticated && jid && jid.getLocal() && jid.getResource()) {
    const result = new Element('iq', {
      type: 'result',
      id,
    })
      .c('session', { xmlns: NS_SESSION })
      .root()
    entity.send(result)
  }
}

module.exports = plugin(
  'session',
  {
    streamFeature: {
      name: 'session',
      xmlns: NS_SESSION,
      match: (entity) => entity.authenticated,
      cb: (feature) => {
        feature.c('optional')
      },
    },

    start() {
      this.plugins['stream-features'].add(this.streamFeature)
      this.entity.router.use(`iq-set/${NS_SESSION}/session`, handler)
    },

    stop() {
      this.plugins['stream-features'].remove(this.streamFeature)
    },

  },
  [streamFeatures]
)
