'use strict'

const tls = require('tls')
const ConnectionTCP = require('@xmpp/connection-tcp')
const {URL} = require('url')

class ConnectionTLS extends ConnectionTCP {
  socketParameters(service) {
    const {port, hostname, protocol} = new URL(service)
    return protocol === 'xmpps:'
      ? {port: Number(port) || 5223, host: hostname}
      : undefined
  }
}

ConnectionTLS.prototype.Socket = tls.TLSSocket
ConnectionTLS.prototype.NS = 'jabber:client'

module.exports = ConnectionTLS
