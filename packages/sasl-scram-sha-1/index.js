'use strict'

const mech = require('sasl-scram-sha-1')

module.exports = function saslScramSha1(sasl) {
  sasl.use(mech)
}
