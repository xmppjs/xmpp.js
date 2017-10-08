'use strict'

const xml = require('@xmpp/xml')

const NS_DISCO_INFO = 'http://jabber.org/protocol/disco#info'

function build(features = [], identities = []) {
  return xml(
    'query',
    {xmlns: NS_DISCO_INFO},
    [...features].map(f => xml('feature', {var: f})),
    [...identities].map(i => xml('identity', i))
  )
}

module.exports = function(callee, features, identities) {
  return callee('get', NS_DISCO_INFO, 'query', () => {
    return build(features, identities)
  })
}
