'use strict'

const tls = require('tls')
const ConnectionTCP = require('@xmpp/connection-tcp')

class ConnectionTLS extends ConnectionTCP {
  socketParameters(service) {
    let {port, hostname, protocol} = new URL(service)
    // https://github.com/nodejs/node/issues/12410#issuecomment-294138912
    if (hostname === '[::1]') {
      hostname = '::1'
    }

    return protocol === 'xmpps:'
      ? {port: Number(port) || 5223, host: hostname}
      : undefined
  }
}

ConnectionTLS.prototype.Socket = tls.TLSSocket
ConnectionTLS.prototype.NS = 'jabber:client'

module.exports = ConnectionTLS
