'use strict'

const {xmpp} = require('@xmpp/client')
const context = require('./context')

module.exports = function(options) {
  const _ = xmpp(options)
  return Object.assign(_, {client: context(_.client)})
}
