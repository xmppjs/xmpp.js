'use strict'

const ConnectionWebSocket = require('./Connection')

module.exports = function websocket({entity}) {
  entity.transports.push(ConnectionWebSocket)
}
