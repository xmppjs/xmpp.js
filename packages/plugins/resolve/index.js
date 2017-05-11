'use strict'

const Transport = require('./lib/Transport')

module.exports.name = 'resolve'
module.exports.plugin = function plugin (entity) {
  entity.transports.push(Transport)
  return {
    entity
  }
}
module.exports.Transport = Transport
