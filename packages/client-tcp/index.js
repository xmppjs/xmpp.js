'use strict'

const Client = require('./lib/Client')

module.exports = function client (...args) {
  return new Client(...args)
}
module.exports.Client = Client
