'use strict'

const {xml, plugin} = require('@xmpp/plugin')
const iqCaller = require('../iq-caller')

const NS_PING = 'urn:xmpp:ping'

module.exports = plugin('ping-caller', {
  NS_PING,
  ping (...args) {
    return this.plugins['iq-caller'].get(xml`<ping xmlns='${NS_PING}'/>`, ...args)
  },
}, [iqCaller])
