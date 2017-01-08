/**
 * References
 * https://xmpp.org/rfcs/rfc6120.html#streams-negotiation Stream Negotiation
 * https://xmpp.org/extensions/xep-0170.html XEP-0170: Recommended Order of Stream Feature Negotiation
 * https://xmpp.org/registrar/stream-features.html XML Stream Features
 */

module.exports.name = 'stream-features'
module.exports.plugin = function plugin (entity) {
  const features = []
  const negotiated = []

  entity.on('nonza', el => {
    if (el.name !== 'stream:features') return

    entity.emit('features', el)

    const streamFeatures = selectFeatures(entity, el)
    if (streamFeatures.length === 0) return

    loopFeatures(streamFeatures, entity, el)
  })

  function selectFeatures (entity, el) {
    return features
      .filter(f => f.match(el, entity) && negotiated.indexOf(f) === -1)
      .sort((a, b) => {
        return a.priority < b.priority
      })
  }

  function loopFeatures (features, entity, el) {
    const feature = features.shift()
    feature.run(entity, el) // eslint-disable-line
      .then(() => {
        if (feature.restart) {
          return entity.restart()
        } else {
          if (features.length) {
            loopFeatures(features, entity, el)
          } else if (entity.jid) {
            entity._online(entity.jid)
          }
        }
      })
      .catch(err => entity.emit('error', err))
  }

  return {
    entity,
    add ({priority, run, match, restart}) {
      features.push({priority, run, match, restart})
    }
  }
}
