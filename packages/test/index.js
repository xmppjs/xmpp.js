'use strict'

const context = require('./context')
const xml = require('@xmpp/xml')
const jid = require('@xmpp/jid')
const mockClient = require('./mockClient')
const {delay, promise} = require('@xmpp/events')

module.exports.context = context
module.exports.xml = xml
module.exports.jid = jid
module.exports.JID = jid
module.exports.mockClient = mockClient
module.exports.delay = delay
module.exports.promise = promise
