'use strict'

const ConnectionTCP = require('./Connection')

module.exports = function tcp({entity}) {
  entity.transports.push(ConnectionTCP)
}
