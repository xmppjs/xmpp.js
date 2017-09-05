'use strict'

const mech = require('sasl-anonymous')
const sasl = require('../sasl')

module.exports.name = 'sasl-anonymous'
module.exports.plugin = function plugin(entity) {
  const SASL = entity.plugin(sasl)
  SASL.use(mech)
  return {
    entity,
  }
}
