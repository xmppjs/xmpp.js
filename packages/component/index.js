'use strict'

const Component = require('./lib/Component')
const xml = require('@xmpp/xml')
const jid = require('@xmpp/jid')

function component (...args) {
  return new Component(...args)
}

module.exports = component
module.exports.component = component
module.exports.Component = Component
module.exports.xml = xml
module.exports.jid = jid
