'use strict'

const client = require('./client')
const context = require('./context')
const xml = require('@xmpp/xml')
const jid = require('@xmpp/jid')

module.exports.client = client
module.exports.context = context
module.exports.xml = xml
module.exports.jid = jid
module.exports.JID = jid
