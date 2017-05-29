'use strict'

const mech = require('sasl-plain')
const sasl = require('../sasl')

module.exports.name = 'sasl-plain'
module.exports.plugin = function plugin(entity) {
  const SASL = entity.plugin(sasl)
  SASL.use(mech)
  return {
    entity,
  }
}
