'use strict'

/**
 * References
 * https://xmpp.org/rfcs/rfc6120.html#streams-negotiation Stream Negotiation
 * https://xmpp.org/extensions/xep-0170.html XEP-0170: Recommended Order of Stream Feature Negotiation
 * https://xmpp.org/registrar/stream-features.html XML Stream Features
 */

function selectFeatures(el, features, entity) {
  return features
    .filter(f => f.match(el, entity) && typeof f.priority === 'number')
    .sort((a, b) => {
      return a.priority < b.priority
    })
}

module.exports = function streamFeatures(router, features) {
  const {entity} = router
  features = features || []

  router.use('stream:features', ({stanza}, next) => {
    const streamFeatures = selectFeatures(stanza, features, entity)
    if (streamFeatures.length === 0) {
      return next()
    }

    function iterate(c) {
      const feature = streamFeatures[c]
      return feature
        .run(entity, stanza)
        .then(() => {
          if (feature.restart) {
            return entity.restart()
          }
          if (c === streamFeatures.length - 1) {
            if (entity.jid) entity._status('online', entity.jid)
            next()
          } else {
            iterate(c + 1)
          }
        })
        .catch(err => entity.emit('error', err))
    }

    return iterate(0)
  })

  return {
    entity,
    router,
    features,
    use({name, priority, run, match, restart}) {
      features.push({name, priority, run, match, restart})
    },
  }
}
