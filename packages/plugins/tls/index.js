'use strict'

const Client = require('@xmpp/client-tls/lib/Client')

module.exports.name = 'tls'
module.exports.plugin = function plugin (entity) {
  entity.transports.push(Client)
  return {
    entity
  }
}
