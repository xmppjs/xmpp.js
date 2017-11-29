'use strict'

const xml = require('@xmpp/xml')

const NS_PING = 'urn:xmpp:ping'
const NS_STANZA = 'urn:ietf:params:xml:ns:xmpp-stanzas'

module.exports = function ping(caller, ...args) {
  caller.get(xml('ping', NS_PING), ...args).catch(err => {
    if (err.getChild('feature-not-implemented', NS_STANZA)) return
    throw err
  })
}
