'use strict'

const client = require('./client')
const context = require('./context')
const xml = require('@xmpp/xml')
const JID = require('@xmpp/jid')

module.exports.client = client
module.exports.context = context
module.exports.xml = xml
module.exports.JID = JID
