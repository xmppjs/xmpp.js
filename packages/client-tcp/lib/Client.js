'use strict'

const url = require('url')
const Connection = require('@xmpp/connection-tcp')

class TCP extends Connection {
  connect(uri) {
    const match = TCP.match(uri)
    if (!match) throw new Error(`Invalid URI "${uri}"`)
    return super.connect(match)
  }

  static match (uri) {
    try {
      const {protocol, hostname, port, slashes} = url.parse(uri)
      if (!slashes || protocol !== 'xmpp:' || !hostname) return false
      return {host: hostname, port: port ? +port : 5222}
    } catch (err) {
      return false
    }
  }
}

TCP.prototype.NS = 'jabber:client'

module.exports = TCP
