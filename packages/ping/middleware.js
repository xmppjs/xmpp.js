'use strict'

const NS_PING = 'urn:xmpp:ping'

module.exports = function(callee) {
  return callee('get', NS_PING, 'ping', () => {})
}
