'use strict'

const ConnectionTCP = require('./lib/Connection')

module.exports.name = 'tcp'
module.exports.plugin = function plugin(entity) {
  entity.transports.push(ConnectionTCP)
}
