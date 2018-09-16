'use strict'

const xml = require('@xmpp/xml')

const NS_TIME = 'urn:xmpp:time'

module.exports = function({iqCaller}) {
  return {
    get(...args) {
      return this.query(...args).then(res => {
        return {
          tzo: res.getChildText('tzo'),
          utc: res.getChildText('utc'),
        }
      })
    },
    query(...args) {
      return iqCaller.get(xml('time', {xmlns: NS_TIME}), ...args)
    },
  }
}
