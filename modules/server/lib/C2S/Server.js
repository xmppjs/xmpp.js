'use strict'

var Server = require('../Server')
var util = require('util')
var Plain = require('./authentication/Plain')
var Session = require('./Session')

/**
 * params:
 *   options : port on which to listen to C2S connections
 *   options.port : xmpp tcp socket port
 *   options.domain : domain of xmpp server
 *   options.autostart : if we start listening at given port
 *   options.requestCert : expect a client certificate (see tls.createSecurePair for more)
 *   options.rejectUnauthorized : reject when client cert missmatches (see tls.createSecurePair for more)
 *   options.tls : wrapper object for tlc config
 *   options.tls.key : private key string
 *   options.tls.cert : certificate string
 *   options.tls.keyPath : path to key
 *   options.tls.certPath : path to certificate
 */
function C2SServer (options) {
  Server.call(this, options)

  this.availableSaslMechanisms = [Plain]

  // don't allow anybody by default when using client cert auth
  if ((this.options.requestCert) &&
    (this.options.rejectUnauthorized !== false)) {
    this.options.rejectUnauthorized = true
  }
}

util.inherits(C2SServer, Server)

C2SServer.prototype.Session = Session

/**
 * returns all registered sasl mechanisms
 */
C2SServer.prototype.getSaslMechanisms = function () {
  return this.availableSaslMechanisms
}

/**
 * removes all registered sasl mechanisms
 */
C2SServer.prototype.clearSaslMechanism = function () {
  this.availableSaslMechanisms = []
}

/**
 * register a new sasl mechanism
 */
C2SServer.prototype.registerSaslMechanism = function (method) {
  // check if method is registered
  if (this.availableSaslMechanisms.indexOf(method) === -1) {
    this.availableSaslMechanisms.push(method)
  }
}

/**
 * unregister an existing sasl mechanism
 */
C2SServer.prototype.unregisterSaslMechanism = function (method) {
  // check if method is registered
  var index = this.availableSaslMechanisms.indexOf(method)
  if (index >= 0) {
    this.availableSaslMechanisms.splice(index, 1)
  }
}

module.exports = C2SServer
