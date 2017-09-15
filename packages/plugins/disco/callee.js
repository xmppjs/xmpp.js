'use strict'

const iq = require('../iq-callee')
const {plugin, xml} = require('@xmpp/plugin')

const NS_DISCO_INFO = 'http://jabber.org/protocol/disco#info'

function build(features = [], identities = []) {
  return xml(
    'query',
    {xmlns: NS_DISCO_INFO},
    ...features.map(f => xml('feature', {var: f})),
    ...identities.map(i => xml('identity', i))
  )
}

module.exports = plugin(
  'disco-callee',
  {
    features: new Set([NS_DISCO_INFO]),
    identities: new Set(),
    start() {
      this.entity.plugins['iq-callee'].get(NS_DISCO_INFO, () => {
        return build(this.features, this.identities)
      })
    },
  },
  [iq]
)
module.exports.build = build
