'use strict'

var inherits = require('node-xmpp-core').inherits
var Mechanism = require('./mechanism')

function Plain () {}

inherits(Plain, Mechanism)

Plain.prototype.name = 'PLAIN'

Plain.prototype.auth = function () {
  return this.authzid + '\0' +
  this.authcid + '\0' +
  this.password
}

Plain.prototype.match = function (options) {
  if (options.password) return true
  return false
}

module.exports = Plain
