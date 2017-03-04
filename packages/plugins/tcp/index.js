'use strict'

const Client = require('@xmpp/client-tcp/lib/Client')

module.exports.name = 'tcp'
module.exports.plugin = function plugin (entity) {
  entity.transports.push(Client)
  return {
    entity
  }
}
