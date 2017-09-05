'use strict'

const {plugin, xml} = require('@xmpp/plugin')
const streamfeatures = require('../stream-features')
const iqCaller = require('../iq-caller')

const NS = 'urn:ietf:params:xml:ns:xmpp-session'

function match(features) {
  const feature = features.getChild('session', NS)
  return Boolean(feature) && !feature.getChild('optional')
}

module.exports = plugin(
  'session-establishment',
  {
    start() {
      const streamFeature = {
        name: 'session-establishment',
        priority: 2000,
        match,
        run: () => this.establishSession(),
      }
      this.plugins['stream-features'].add(streamFeature)
    },
    establishSession() {
      return this.entity.plugins['iq-caller'].set(
        xml('session', 'urn:ietf:params:xml:ns:xmpp-session')
      )
    },
  },
  [streamfeatures, iqCaller]
)
module.exports.match = match
