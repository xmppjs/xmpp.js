'use strict'

const util = require('util')
const Mechanism = require('./Mechanism')

class Plain extends Mechanism {
  extractSasl(auth) {
    const params = auth.split('\x00')
    const authRequest = {
      'username': params[1],
      'password': params[2],
    }
    return authRequest
  }
}

Plain.prototype.name = 'PLAIN'
Plain.id = 'PLAIN'

module.exports = Plain
