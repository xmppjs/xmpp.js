'use strict'

const xml = require('@xmpp/xml')

const NS = 'urn:ietf:params:xml:ns:xmpp-session'

function match(features) {
  const feature = features.getChild('session', NS)
  return Boolean(feature) && !feature.getChild('optional')
}

module.exports = function sessionEstablishment(streamFeatures) {
  const {entity} = streamFeatures

  function establishSession() {
    return entity.plugins['iq-caller'].set(
      xml('session', 'urn:ietf:params:xml:ns:xmpp-session')
    )
  }

  streamFeatures.use({
    name: 'session-establishment',
    priority: 2000,
    match,
    run: () => establishSession(),
  })

  return {
    entity,
    streamFeatures,
  }
}

module.exports.match = match
