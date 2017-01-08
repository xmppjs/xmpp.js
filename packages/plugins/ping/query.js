'use strict'

const xml = require('@xmpp/xml')
const iqCaller = require('../iq-caller')

const NS_PING = 'urn:xmpp:ping'

function plugin (entity) {
  const caller = entity.plugin(iqCaller)

  return {
    entity,
    ping (to, ...args) {
      return caller.get(to, xml`<ping xmlns='${NS_PING}'/>`, ...args)
    }
  }
}

module.exports = {
  name: 'ping-query',
  NS_PING,
  plugin
}
