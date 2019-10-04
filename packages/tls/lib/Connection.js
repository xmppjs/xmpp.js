'use strict'

const tls = require('tls')
const {parseURI} = require('@xmpp/connection/lib/util')
const ConnectionTCP = require('@xmpp/connection-tcp')

class ConnectionTLS extends ConnectionTCP {
  socketParameters(service) {
    const {port, hostname, protocol} = parseURI(service)
    return protocol === 'xmpps:'
      ? {port: Number(port) || 5223, host: hostname}
      : undefined
  }
}

ConnectionTLS.prototype.Socket = tls.TLSSocket
ConnectionTLS.prototype.NS = 'jabber:client'

module.exports = ConnectionTLS
