'use strict'

const mech = require('sasl-plain')

module.exports = function saslPlain(sasl) {
  sasl.use(mech)
}
