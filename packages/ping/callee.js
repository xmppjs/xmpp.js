'use strict'

const NS_PING = 'urn:xmpp:ping'

module.exports = function({discoCallee, iqCallee}) {
  discoCallee.features.add(NS_PING)
  iqCallee.get(NS_PING, 'ping', () => true)
}
