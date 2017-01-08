'use strict'

const iqCallee = require('../iq-callee')
const discoInfo = require('../disco-info')

const NS_PING = 'urn:xmpp:ping'

function match (stanza) {
  return stanza.getChild('query', NS_PING)
}

function plugin (entity) {
  const disco = entity.plugin(discoInfo)
  disco.addFeature(NS_PING)

  const callee = entity.plugin(iqCallee)
  callee.add(match, (match, cb) => {
    cb()
  })

  return {
    entity
  }
}

module.exports = {
  NS_PING,
  match,
  name: 'ping-handle',
  plugin
}
