'use strict'

const Client = require('./lib/Client')
const {xml, jid} = require('@xmpp/client-core')
const reconnect = require('@xmpp/reconnect')

function xmpp() {
  const client = new Client()
  return {
    client,
    reconnect: reconnect(client),
  }
}

module.exports.Client = Client
module.exports.xml = xml
module.exports.jid = jid
module.exports.xmpp = xmpp
