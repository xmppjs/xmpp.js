'use strict'

const ConnectionTLS = require('./lib/Connection')

module.exports.name = 'tls'
module.exports.plugin = function plugin(entity) {
  entity.transports.push(ConnectionTLS)
}
