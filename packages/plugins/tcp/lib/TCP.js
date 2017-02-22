const URL = require('url').URL
const Connection = require('@xmpp/connection-tcp')

class TCP extends Connection {
  static match (uri) {
    const {protocol, hostname, port} = new URL(uri)
    if (protocol !== 'xmpp:') return false

    return {host: hostname, port: port || 5222}
  }
}

TCP.prototype.NS = 'jabber:client'

module.exports = TCP
