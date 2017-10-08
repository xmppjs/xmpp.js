'use strict'

const Server = require('../Server')
const util = require('util')
const Plain = require('./authentication/Plain')
const Session = require('./Session')

/**
 * Params:
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

  // Don't allow anybody by default when using client cert auth
  if ((this.options.requestCert) &&
    (this.options.rejectUnauthorized !== false)) {
    this.options.rejectUnauthorized = true
  }
}

util.inherits(C2SServer, Server)

C2SServer.prototype.Session = Session

/**
 * Returns all registered sasl mechanisms
 */
C2SServer.prototype.getSaslMechanisms = function () {
  return this.availableSaslMechanisms
}

/**
 * Removes all registered sasl mechanisms
 */
C2SServer.prototype.clearSaslMechanism = function () {
  this.availableSaslMechanisms = []
}

/**
 * Register a new sasl mechanism
 */
C2SServer.prototype.registerSaslMechanism = function (method) {
  // Check if method is registered
  if (this.availableSaslMechanisms.indexOf(method) === -1) {
    this.availableSaslMechanisms.push(method)
  }
}

/**
 * Unregister an existing sasl mechanism
 */
C2SServer.prototype.unregisterSaslMechanism = function (method) {
  // Check if method is registered
  const index = this.availableSaslMechanisms.indexOf(method)
  if (index >= 0) {
    this.availableSaslMechanisms.splice(index, 1)
  }
}

module.exports = C2SServer
