'use strict'

const SASLPlugin = require('./lib/SASLPlugin')
const streamfeatures = require('../stream-features')

const NS = 'urn:ietf:params:xml:ns:xmpp-sasl'

function match (features) {
  return features.getChild('mechanisms', NS)
}

const streamFeature = {
  name: 'sasl',
  priority: 1000,
  match,
  restart: true,
  run: (entity, features) => {
    return entity.plugins.sasl.gotFeatures(features)
  },
}

module.exports.name = 'sasl'
module.exports.plugin = function plugin (entity) {
  const streamFeatures = entity.plugin(streamfeatures)
  streamFeatures.add(streamFeature)

  return new SASLPlugin(entity)
}
