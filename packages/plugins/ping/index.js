'use strict'

const plugin = require('@xmpp/plugin')

const callee = require('./callee')
const caller = require('./caller')

module.exports = plugin('ping', {
  NS_PING: 'urn:xmpp:ping',
  ping (...args) {
    return this.plugins['ping-caller'].ping(...args)
  },
}, [callee, caller])
