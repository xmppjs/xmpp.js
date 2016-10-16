'use strict'

const iqCallee = require('../iq-callee')
const xml = require('@xmpp/xml')

const NS_DISCO_INFO = 'http://jabber.org/protocol/disco#info'

function match (stanza) {
  return stanza.getChild('query', NS_DISCO_INFO)
}

function build (features = [], identities = []) {
  const query = xml`<query xmlns='${NS_DISCO_INFO}'/>`
  features.forEach((feature) => {
    query.c('feature', {var: feature})
  })
  identities.forEach((identity) => {
    query.c('identitiy', identity)
  })
  return query
}

function plugin (entity) {
  const features = new Set([NS_DISCO_INFO])
  const identities = new Set()

  const callee = entity.plugin(iqCallee)
  callee.add(match, (stanza) => {
    return build(features, identities)
  })

  return {
    features,
    identities,
    addFeature (feature) {
      features.add(feature)
    },
    removeFeature (feature) {
      features.delete(feature)
    },
    getFeatures () {
      return features
    },
    addIdentity (identity) {
      identities.add(identity)
    },
    removeIdentity (identity) {
      identities.remove(identity)
    },
    getIdentities (identities) {
      return identities
    }
  }
}

module.exports = {
  NS_DISCO_INFO,
  match,
  name: 'disco-info',
  plugin,
  build
}
