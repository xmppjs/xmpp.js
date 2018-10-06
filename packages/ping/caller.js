'use strict'

const xml = require('@xmpp/xml')

const NS_PING = 'urn:xmpp:ping'

module.exports = function({iqCaller}) {
  return {
    async ping(...args) {
      try {
        await iqCaller.get(xml('ping', NS_PING), ...args)
      } catch (err) {
        if (err.condition === 'feature-not-implemented') return
        throw err
      }
    },
  }
}
