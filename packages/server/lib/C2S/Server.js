'use strict'

const Server = require('../Server')
const Plain = require('./authentication/Plain')
const accept = require('../plugins/accept')
const features = require('../plugins/features')

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
class C2SServer extends Server {
  constructor(options) {
    super(options)

    this.availableSaslMechanisms = [Plain]

    // Don't allow anybody by default when using client cert auth
    if ((this.options.requestCert) &&
      (this.options.rejectUnauthorized !== false)) {
      this.options.rejectUnauthorized = true
    }
  }

  /**
   * Returns all registered sasl mechanisms
   */
  getSaslMechanisms() {
    return this.availableSaslMechanisms
  }

  /**
   * Removes all registered sasl mechanisms
   */
  clearSaslMechanism() {
    this.availableSaslMechanisms = []
  }

  /**
   * Register a new sasl mechanism
   */
  registerSaslMechanism(method) {
    // Check if method is registered
    if (this.availableSaslMechanisms.indexOf(method) === -1) {
      this.availableSaslMechanisms.push(method)
    }
  }

  /**
   * Unregister an existing sasl mechanism
   */
  unregisterSaslMechanism(method) {
    // Check if method is registered
    const index = this.availableSaslMechanisms.indexOf(method)
    if (index >= 0) {
      this.availableSaslMechanisms.splice(index, 1)
    }
  }
}

C2SServer.prototype.plugins = {
  accept,
  features,
}

module.exports = C2SServer
