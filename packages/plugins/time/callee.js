'use strict'

const iq = require('../iq-callee')
const disco = require('../disco/callee')
const time = require('@xmpp/time')
const {xml, plugin} = require('@xmpp/plugin')

const NS_TIME = 'urn:xmpp:time'

module.exports = plugin(
  'time-callee',
  {
    start() {
      this.plugins['disco-callee'].features.add(NS_TIME)
      this.plugins['iq-callee'].get(NS_TIME, () => {
        return xml(
          'time',
          {xmlns: NS_TIME},
          xml('tzo', time.offset()),
          xml('utc', time.datetime())
        )
      })
    },
  },
  [disco, iq]
)
