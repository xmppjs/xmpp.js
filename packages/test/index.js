'use strict'

const client = require('./client')
const context = require('./context')
const xml = require('@xmpp/xml')
const JID = require('@xmpp/jid')
const middleware = require('@xmpp/middleware')

module.exports.client = client
module.exports.context = context
module.exports.xml = xml
module.exports.JID = JID
module.exports.middleware = middleware
module.exports.testPlugin = function testPlugin(plugin) {
  const ctx = client()
  const p = plugin({entity: ctx.entity})
  ctx.plugin = p
  return ctx
}
