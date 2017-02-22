const URL = require('url').URL
const tls = require('tls')
const Connection = require('@xmpp/connection-tcp')

class TLS extends Connection {
  static match (uri) {
    const {protocol, hostname, port} = new URL(uri)
    if (protocol !== 'xmpps:') return false

    return {host: hostname, port: port || 5223}
  }
}

TLS.prototype.Socket = tls.TLSSocket

TLS.prototype.NS = 'jabber:client'

module.exports = TLS
