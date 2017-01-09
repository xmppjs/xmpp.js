'use strict'

const Client = require('./lib/Client')
const xml = require('@xmpp/xml')
const jid = require('@xmpp/jid')

module.exports = function client (...args) {
  return new Client(...args)
}
module.exports.Client = Client
module.exports.xml = xml
module.exports.jid = jid
