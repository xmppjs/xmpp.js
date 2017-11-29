'use strict'

const xml = require('@xmpp/xml')

const NS = 'urn:ietf:params:xml:ns:xmpp-session'

function match(features) {
  const feature = features.getChild('session', NS)
  return Boolean(feature) && !feature.getChild('optional')
}

module.exports = function() {
  return function({stanza, entity}, next) {
    if (!match(stanza)) return next()
    return entity.plugins['iq-caller']
      .set(xml('session', 'urn:ietf:params:xml:ns:xmpp-session'))
      .then(() => {
        return next()
      })
  }
}

module.exports.match = match
