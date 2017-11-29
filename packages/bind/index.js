'use strict'

const xml = require('@xmpp/xml')

/*
 * References
 * https://xmpp.org/rfcs/rfc6120.html#bind
 */

const NS = 'urn:ietf:params:xml:ns:xmpp-bind'

function makeBindElement(resource) {
  return xml('bind', {xmlns: NS}, resource && xml('resource', {}, resource))
}

function match(features) {
  return features.getChild('bind', NS)
}

module.exports = function bind(streamFeatures) {
  const {entity} = streamFeatures

  function bind(resource) {
    entity._status('binding')
    return entity.plugins['iq-caller']
      .set(makeBindElement(resource))
      .then(result => {
        const jid = result.getChildText('jid')
        entity._jid(jid)
        entity._status('bound')
        return jid
      })
  }

  function handleFeature() {
    entity._status('bind')
    return entity.isHandled('bind')
      ? entity.delegate('bind', resource => bind(resource))
      : bind()
  }

  streamFeatures.use({
    name: 'bind',
    priority: 2500,
    match,
    run: () => handleFeature(),
  })

  return {bind}
}
