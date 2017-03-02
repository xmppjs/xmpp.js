'use strict'

const xml = require('@xmpp/xml')
const streamfeatures = require('../stream-features')
const iqCaller = require('../iq-caller')

/*
 * References
 * https://xmpp.org/rfcs/rfc6120.html#bind
 */

const NS = 'urn:ietf:params:xml:ns:xmpp-bind'

function makeBindElement (resource) {
  const stanza = xml`<bind xmlns='${NS}'/>`
  if (resource) stanza.cnode(xml`<resource>${resource}</resource>`)
  return stanza
}

function match (features) {
  return features.getChild('bind', NS)
}

function bind (caller, entity, resource) {
  return caller.set(null, makeBindElement(resource)).then(result => {
    entity._jid(result.getChild('jid').text())
  })
}

module.exports.name = 'bind'
module.exports.plugin = function plugin (entity) {
  const caller = entity.plugin(iqCaller)

  const p = {
    entity,
    getResource () {}
  }

  const streamFeature = {
    name: 'bind',
    priority: 2500,
    match,
    run: (entity) => {
      return Promise.resolve((p.getResource())).then((resource) => {
        return bind(caller, entity, resource)
      })
    }
  }

  const streamFeatures = entity.plugin(streamfeatures)
  streamFeatures.add(streamFeature)
  return p
}
