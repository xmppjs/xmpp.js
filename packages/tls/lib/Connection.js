'use strict'

const tls = require('tls')
const ConnectionTCP = require('@xmpp/connection-tcp')
const url = require('url')

class ConnectionTLS extends ConnectionTCP {
  socketParameters(uri) {
    const {port, hostname, protocol} = url.parse(uri)
    return protocol === 'xmpps:'
      ? {port: Number(port) || 5223, host: hostname}
      : undefined
  }
}

ConnectionTLS.prototype.Socket = tls.TLSSocket
ConnectionTLS.prototype.NS = 'jabber:client'

module.exports = ConnectionTLS
