'use strict'

const ConnectionWebSocket = require('./lib/Connection')

module.exports.name = 'websocket'
module.exports.plugin = function plugin(entity) {
  entity.transports.push(ConnectionWebSocket)
  return {
    entity,
  }
}
