'use strict'

var util = require('util')
var Mechanism = require('./Mechanism')

function Plain () {}

util.inherits(Plain, Mechanism)

Plain.prototype.name = 'PLAIN'
Plain.id = 'PLAIN'

Plain.prototype.extractSasl = function (auth) {
  var params = auth.split('\x00')
  var authRequest = {
    'username': params[1],
    'password': params[2]
  }
  return authRequest
}

module.exports = Plain
