'use strict'

const Server = require('../Server')

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

    // Don't allow anybody by default when using client cert auth
    if ((this.options.requestCert) &&
      (this.options.rejectUnauthorized !== false)) {
      this.options.rejectUnauthorized = true
    }
  }
}

C2SServer.prototype.plugins = {
  accept: require('../plugins/accept'),
  features: require('../plugins/stream-features'),
  sasl: require('../plugins/sasl'),
  bind: require('../plugins/bind'),
  session: require('../plugins/session'),
}

module.exports = C2SServer
module.exports.auth = {
  AbstractMechanism: require('./authentication/Mechanism'),
  Mechanism: require('./authentication/Mechanism'),
  Plain: require('./authentication/Plain'),
  DigestMD5: require('./authentication/DigestMD5'),
  XOAuth2: require('./authentication/XOAuth2'),
  Anonymous: require('./authentication/Anonymous'),
}
