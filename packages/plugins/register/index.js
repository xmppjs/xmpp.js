'use strict'

const streamfeatures = require('../stream-features')
const iqCaller = require('../iq-caller')
const RegisterPlugin = require('./lib/Plugin')

/*
 * References
 * https://xmpp.org/extensions/xep-0077.html
 */

const NS_STREAM_FEATURE = 'http://jabber.org/features/iq-register'

function match (features) {
  return features.getChild('register', NS_STREAM_FEATURE)
}

const streamFeature = {
  name: 'register',
  match,
  run: (entity, features) => {
    return entity.plugins.register.gotFeatures(features)
  }
}

module.exports.name = 'register'
module.exports.plugin = function plugin (entity) {
  const streamFeatures = entity.plugin(streamfeatures)
  streamFeatures.add(streamFeature)

  const caller = entity.plugin(iqCaller)
  return new RegisterPlugin(entity, caller)
}
