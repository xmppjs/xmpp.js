'use strict'

/**
 * References
 * https://xmpp.org/rfcs/rfc6120.html#streams-negotiation Stream Negotiation
 * https://xmpp.org/extensions/xep-0170.html XEP-0170: Recommended Order of Stream Feature Negotiation
 * https://xmpp.org/registrar/stream-features.html XML Stream Features
 */

const plugin = require('@xmpp/plugin')

module.exports = plugin('stream-features', {
  start () {
    this.features = []
    this.negotiated = []

    const {entity} = this
    this.handler = (el) => {
      if (el.name !== 'stream:features') return

      const streamFeatures = this.selectFeatures(el)
      if (streamFeatures.length === 0) return

      const features = streamFeatures.map((feature) => {
        return {
          name: feature.name,
          run: (...args) => {
            return feature.run(entity, el, ...args).then(() => {
              if (feature.restart) {
                return entity.restart()
              } else if (entity.jid) {
                entity._online(entity.jid)
              } else {
                this.onStreamFeatures(features, el)
              }
            })
            .catch(err => entity.emit('error', err))
          },
        }
      })

      this.onStreamFeatures(features, el)
    }

    entity.on('nonza', this.handler)
  },

  stop () {
    delete this.features
    delete this.negotiated
    this.entity.off('nonza', this.handler)
    delete this.handler
  },

  selectFeatures (el) {
    return this.features
      .filter(f => f.match(el, this.entity) && this.negotiated.indexOf(f) === -1 && typeof f.priority === 'number')
      .sort((a, b) => {
        return a.priority < b.priority
      })
  },

  onStreamFeatures (features) {
    const feature = features.shift()
    feature.run()
  },

  add ({name, priority, run, match, restart}) {
    this.features.push({name, priority, run, match, restart})
  },
})
