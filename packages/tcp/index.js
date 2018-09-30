'use strict'

const ConnectionTCP = require('./lib/Connection')

module.exports = function tcp({entity}) {
  entity.transports.push(ConnectionTCP)
}
