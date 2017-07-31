'use strict'

const ConnectionTCP = require('@xmpp/connection-tcp')

class Connection extends ConnectionTCP {
  connectParameters(uri) {
    const params = super.connectParameters(uri)
    params.port = params.port || 5222
    return params
  }
}

Connection.prototype.NS = 'jabber:client'

module.exports = Connection
