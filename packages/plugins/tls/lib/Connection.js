'use strict'

const tls = require('tls')
const ConnectionTCP = require('@xmpp/connection-tcp')
const Connection = require('@xmpp/connection')

class ConnectionTLS extends ConnectionTCP {
  socketParameters (URI) {
    const params = Connection.prototype.socketParameters(URI)
    params.port = params.port || 5223
    return (params.protocol === 'xmpps:')
      ? params
      : undefined
  }
}

ConnectionTLS.prototype.Socket = tls.TLSSocket
ConnectionTLS.prototype.NS = 'jabber:client'

module.exports = ConnectionTLS
