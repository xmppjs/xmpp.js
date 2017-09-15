'use strict'

const iq = require('../iq-caller')
const {xml, plugin} = require('@xmpp/plugin')

const NS_VERSION = 'jabber:iq:version'

module.exports = plugin(
  'version-caller',
  {
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
      return this.plugins['iq-caller'].get(
        xml('query', {xmlns: NS_VERSION}),
        ...args
      )
    },
  },
  [iq]
)
