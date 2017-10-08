'use strict'

const util = require('util')
const Mechanism = require('./Mechanism')

function Plain () {}

util.inherits(Plain, Mechanism)

Plain.prototype.name = 'PLAIN'
Plain.id = 'PLAIN'

Plain.prototype.extractSasl = function (auth) {
  const params = auth.split('\x00')
  const authRequest = {
    'username': params[1],
    'password': params[2],
  }
  return authRequest
}

module.exports = Plain
