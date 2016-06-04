const TCP = require('./lib/TCP')

module.exports.name = 'tcp'
module.exports.plugin = function plugin (entity) {
  entity.transports.push(TCP)
  return {
    entity
  }
}
module.exports.TCP = TCP
