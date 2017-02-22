'use strict'

const xml = require('@xmpp/xml')
const streamfeatures = require('../stream-features')
const iqCaller = require('../iq-caller')

/*
 * References
 * https://tools.ietf.org/html/draft-cridland-xmpp-session-01
 */

const NS = 'urn:ietf:params:xml:ns:xmpp-session'

function match (features) {
  const session = features.getChild('session', NS)
  return session && !session.getChild('optional')
}

module.exports.name = 'session-establishment'
module.exports.plugin = function plugin (entity) {
  const caller = entity.plugin(iqCaller)

  const streamFeature = {
    priority: 2000,
    match,
    run: (entity) => {
      return caller.set(null, xml`<session xmlns='${NS}'/>`)
    }
  }

  const streamFeatures = entity.plugin(streamfeatures)
  streamFeatures.add(streamFeature)
  return {
    entity
  }
}
