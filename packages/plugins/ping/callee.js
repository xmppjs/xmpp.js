'use strict'

const plugin = require('@xmpp/plugin')
const iqCallee = require('../iq-callee')
const discoInfo = require('../disco-info')

const NS_PING = 'urn:xmpp:ping'

module.exports = plugin('ping-callee', {
  NS_PING,
  start () {
    this.plugins['disco-info'].addFeature(NS_PING)
    this.plugins['iq-callee'].add('ping', NS_PING, () => {
      return Promise.resolve()
    })
  },
  stop () {
    this.plugins['disco-info'].removeFeature(NS_PING)
    this.plugins['iq-callee'].remove('ping', NS_PING)
  },
}, [iqCallee, discoInfo])
