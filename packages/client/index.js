'use strict'

const entries = Object.entries || require('object.entries') // eslint-disable-line node/no-unsupported-features

const Client = require('./lib/Client')
const {xml, jid} = require('@xmpp/client-core')

const reconnect = require('@xmpp/reconnect')
const tcp = require('@xmpp/tcp')
const websocket = require('@xmpp/websocket')
const tls = require('@xmpp/tls')
const packages = {reconnect, tcp, websocket, tls}

function xmpp() {
  const client = new Client()
  return Object.assign(
    {client},
    ...entries(packages)
      // Ignore browserify stubs
      .filter(([, v]) => typeof v === 'function')
      .map(([k, v]) => [v(client), k])
  )
}

module.exports.Client = Client
module.exports.xml = xml
module.exports.jid = jid
module.exports.xmpp = xmpp
