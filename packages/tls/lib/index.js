'use strict'

const ConnectionTLS = require('./Connection')

module.exports = function tls({entity}) {
  entity.transports.push(ConnectionTLS)
}
