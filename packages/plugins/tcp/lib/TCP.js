const url = require('url')
const Connection = require('@xmpp/connection-tcp')

class TCP extends Connection {
  connect (uri) {
    const {hostname, port} = url.parse(uri)
    return super.connect({port: port || 5222, hostname})
  }

  static match (uri) {
    return uri.startsWith('xmpp:') ? uri : null
  }
}

TCP.prototype.NS = 'jabber:client'

module.exports = TCP
