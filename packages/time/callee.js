'use strict'

const time = require('./time')
const xml = require('@xmpp/xml')

const NS_TIME = 'urn:xmpp:time'

module.exports = function({discoCallee, iqCallee}) {
  discoCallee.features.add(NS_TIME)
  iqCallee.get(NS_TIME, () => {
    const tzo = time.offset()
    const utc = time.datetime()

    return xml(
      'time',
      {xmlns: NS_TIME},
      xml('tzo', {}, tzo),
      xml('utc', {}, utc)
    )
  })
}
