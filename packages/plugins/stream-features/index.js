'use strict'

/**
 * References
 * https://xmpp.org/rfcs/rfc6120.html#streams-negotiation Stream Negotiation
 * https://xmpp.org/extensions/xep-0170.html XEP-0170: Recommended Order of Stream Feature Negotiation
 * https://xmpp.org/registrar/stream-features.html XML Stream Features
 */

const plugin = require('@xmpp/plugin')

module.exports = plugin('stream-features', {
  start() {
    this.features = []

    const {entity} = this
    this.handler = el => {
      if (el.name !== 'stream:features') {
        return
      }

      const streamFeatures = this.selectFeatures(el)
      if (streamFeatures.length === 0) {
        return
      }

      function iterate(c) {
        const feature = streamFeatures[c]
        return feature
          .run(entity, el)
          .then(() => {
            if (feature.restart) {
              return entity.restart()
            } else if (c === streamFeatures.length - 1) {
              if (entity.jid) entity._status('online', entity.jid)
            } else {
              iterate(c + 1)
            }
          })
          .catch(err => entity.emit('error', err))
      }

      return iterate(0)
    }

    entity.on('nonza', this.handler)
  },

  stop() {
    delete this.features
    this.entity.off('nonza', this.handler)
    delete this.handler
  },

  selectFeatures(el) {
    return this.features
      .filter(f => f.match(el, this.entity) && typeof f.priority === 'number')
      .sort((a, b) => {
        return a.priority < b.priority
      })
  },

  add({name, priority, run, match, restart}) {
    this.features.push({name, priority, run, match, restart})
  },
})
