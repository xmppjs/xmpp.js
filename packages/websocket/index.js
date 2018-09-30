'use strict'

const ConnectionWebSocket = require('./lib/Connection')

module.exports = function websocket({entity}) {
  entity.transports.push(ConnectionWebSocket)
}
