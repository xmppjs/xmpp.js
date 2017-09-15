'use strict'

const iq = require('../iq-caller')
const {plugin, xml} = require('@xmpp/plugin')

const NS_PING = 'urn:xmpp:ping'

module.exports = plugin(
  'ping-caller',
  {
    ping(...args) {
      return this.plugins['iq-caller'].get(xml('ping', NS_PING), ...args)
    },
  },
  [iq]
)
