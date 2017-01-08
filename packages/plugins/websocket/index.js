const WebSocket = require('./lib/WebSocket')

module.exports.name = 'websocket'
module.exports.plugin = function plugin (entity) {
  entity.transports.push(WebSocket)
  return {
    entity
  }
}
