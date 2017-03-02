'use strict'

/**
 * References
 * https://xmpp.org/rfcs/rfc6120.html#streams-negotiation Stream Negotiation
 * https://xmpp.org/extensions/xep-0170.html XEP-0170: Recommended Order of Stream Feature Negotiation
 * https://xmpp.org/registrar/stream-features.html XML Stream Features
 */

const Plugin = require('./lib/Plugin')

module.exports.name = 'stream-features'
module.exports.plugin = function plugin (entity) {
  const streamFeatures = new Plugin(entity)
  return streamFeatures
}
