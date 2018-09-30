'use strict'

const {client} = require('@xmpp/client')
const context = require('./context')

module.exports = function(options) {
  const xmpp = client(options)
  const ctx = context(xmpp)
  return Object.assign(xmpp, ctx)
}
