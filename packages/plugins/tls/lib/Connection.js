'use strict'

const tls = require('tls')
const ConnectionTCP = require('@xmpp/connection-tcp')
const Connection = require('@xmpp/connection')

class ConnectionTLS extends ConnectionTCP {
  socketParameters(URI) {
    const {port, host, protocol} = Connection.prototype.socketParameters(URI)
    return protocol === 'xmpps:' ? {port: port || 5223, host} : undefined
  }
}

ConnectionTLS.prototype.Socket = tls.TLSSocket
ConnectionTLS.prototype.NS = 'jabber:client'

module.exports = ConnectionTLS
