'use strict'

const iq = require('../iq-caller')
const {xml, plugin} = require('@xmpp/plugin')

const NS_TIME = 'urn:xmpp:time'

module.exports = plugin(
  'time-caller',
  {
    get(...args) {
      return this.query(...args).then(res => {
        return {
          tzo: res.getChildText('tzo'),
          utc: res.getChildText('utc'),
        }
      })
    },
    query(...args) {
      return this.plugins['iq-caller'].get(
        xml('time', {xmlns: NS_TIME}),
        ...args
      )
    },
  },
  [iq]
)
