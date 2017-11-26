'use strict'

const mech = require('sasl-scram-sha-1')

module.exports = function saslAnonymous(sasl) {
  sasl.use(mech)
}
