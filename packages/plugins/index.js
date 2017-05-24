'use strict'

;[
  'disco-info',
  'entity-capabilities',
  'iq-callee',
  'iq-caller',
  'ping',
  'stanza-router',
  'version',
  'time',
  'vcard',
].map(plugin => require(`./${plugin}`)).forEach((plugin) => {
  module.exports[plugin.name] = plugin
})
