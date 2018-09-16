'use strict'

const xml = require('@xmpp/xml')

const NS_PING = 'urn:xmpp:ping'
const NS_STANZA = 'urn:ietf:params:xml:ns:xmpp-stanzas'

module.exports = function({iqCaller}) {
  return {
    ping(...args) {
      return iqCaller.get(xml('ping', NS_PING), ...args).catch(err => {
        if (err.getChild('feature-not-implemented', NS_STANZA)) return
        throw err
      })
    },
  }
}
