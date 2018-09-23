'use strict'

const xml = require('@xmpp/xml')

const NS = 'urn:ietf:params:xml:ns:xmpp-session'

module.exports = function({iqCaller, streamFeatures}) {
  streamFeatures.use('session', NS, async (context, next, feature) => {
    if (feature.getChild('optional')) return next()
    await iqCaller.set(xml('session', NS))
    return next()
  })
}
