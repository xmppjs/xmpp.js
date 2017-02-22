const tls = require('./lib/TLS')

module.exports.name = 'tls'
module.exports.plugin = function plugin (entity) {
  entity.transports.push(tls)
  return {
    entity
  }
}
module.exports.tls = tls
