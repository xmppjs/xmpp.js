'use strict'

const xml = require('@xmpp/xml')

const NS_VERSION = 'jabber:iq:version'

module.exports = function({iqCaller}) {
  return {
    get(...args) {
      return this.query(...args).then(res => {
        return {
          os: res.getChildText('os'),
          version: res.getChildText('version'),
          name: res.getChildText('name'),
        }
      })
    },
    query(...args) {
      return iqCaller.get(xml('query', {xmlns: NS_VERSION}), ...args)
    },
  }
}
