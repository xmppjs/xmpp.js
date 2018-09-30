'use strict'

const ConnectionTLS = require('./lib/Connection')

module.exports = function tls({entity}) {
  entity.transports.push(ConnectionTLS)
}
