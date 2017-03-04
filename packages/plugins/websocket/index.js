'use strict'

const Client = require('@xmpp/client-websocket/lib/Client')

module.exports.name = 'websocket'
module.exports.plugin = function plugin (entity) {
  entity.transports.push(Client)
  return {
    entity
  }
}
