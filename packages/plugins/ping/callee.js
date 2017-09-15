'use strict'

const iq = require('../iq-callee')
const disco = require('../disco/callee')
const plugin = require('@xmpp/plugin')

const NS_PING = 'urn:xmpp:ping'

module.exports = plugin(
  'ping-callee',
  {
    start() {
      this.plugins['disco-callee'].features.add(NS_PING)
      this.plugins['iq-callee'].get(NS_PING, () => {})
    },
  },
  [disco, iq]
)
