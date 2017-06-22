'use strict'

const iqCallee = require('../iq-callee')
const discoInfo = require('../disco-info')
const xml = require('@xmpp/xml')
const time = require('@xmpp/time')

const NS_TIME = 'urn:xmpp:time'

function match(stanza) {
  return stanza.getChild('time', NS_TIME)
}

function plugin(entity) {
  const disco = entity.plugin(discoInfo)
  disco.addFeature(NS_TIME)

  const callee = entity.plugin(iqCallee)
  callee.add(match, () => (
    xml('time', {xmlns: NS_TIME},
      xml('tzo', {}, time.offset()),
      xml('utc', {}, time.datetime())
    )
  ))

  return {
    entity,
  }
}

module.exports = {
  NS_TIME,
  match,
  name: 'time-handle',
  plugin,
}
