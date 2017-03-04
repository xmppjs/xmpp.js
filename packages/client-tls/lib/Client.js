'use strict'

const url = require('url')
const tls = require('tls')
const Connection = require('@xmpp/connection-tcp')

class TLS extends Connection {
  static match (uri) {
    try {
      const {protocol, hostname, port, slashes} = url.parse(uri)
      if (!slashes || protocol !== 'xmpps:' || !hostname) return false
      return {host: hostname, port: port ? +port : 5223}
    } catch (err) {
      return false
    }
  }
}

TLS.prototype.Socket = tls.TLSSocket

TLS.prototype.NS = 'jabber:client'

module.exports = TLS
