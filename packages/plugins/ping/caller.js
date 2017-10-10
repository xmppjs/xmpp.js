'use strict'

const iq = require('../iq-caller')
const {plugin, xml} = require('@xmpp/plugin')

const NS_PING = 'urn:xmpp:ping'
const NS_STANZA = 'urn:ietf:params:xml:ns:xmpp-stanzas'

module.exports = plugin(
  'ping-caller',
  {
    ping(...args) {
      return this.plugins['iq-caller'].get(xml('ping', NS_PING), ...args).catch(err => {
        if (err.getChild('feature-not-implemented', NS_STANZA)) return
        throw err
      })
    },
  },
  [iq]
)
