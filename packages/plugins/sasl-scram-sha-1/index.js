'use strict'

const mech = require('sasl-scram-sha-1')
const sasl = require('../sasl')

module.exports.name = 'sasl-scram-sha-1'
module.exports.plugin = function plugin(entity) {
  const SASL = entity.plugin(sasl)
  SASL.use(mech)
  return {
    entity,
  }
}
