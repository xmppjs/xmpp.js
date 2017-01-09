const url = require('url')
const Connection = require('@xmpp/connection-tcp')

class TCP extends Connection {
  static match (uri) {
    const {protocol, hostname, port, slashes} = url.parse(uri)
    if (!slashes || protocol !== 'xmpp:' || !hostname) return false

    return {host: hostname, port: port ? +port : 5222}
  }
}

TCP.prototype.NS = 'jabber:client'

module.exports = TCP
