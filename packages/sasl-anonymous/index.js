'use strict'

const mech = require('sasl-anonymous')

module.exports = function saslAnonymous(sasl) {
  sasl.use(mech)
}
