'use strict'

const Client = require('./lib/Client')
const xml = require('@xmpp/xml')
const jid = require('@xmpp/jid')

function client(...args) {
  return new Client(...args)
}

module.exports = client
module.exports.client = client
module.exports.Client = Client
module.exports.xml = xml
module.exports.jid = jid
