'use strict'

const xml = require('@xmpp/xml')

// https://tools.ietf.org/html/draft-cridland-xmpp-session-01

const NS = 'urn:ietf:params:xml:ns:xmpp-session'

module.exports = function({iqCaller, streamFeatures}) {
  streamFeatures.use('session', NS, async (context, next, feature) => {
    if (feature.getChild('optional')) return next()
    await iqCaller.set(xml('session', NS))
    return next()
  })
}
