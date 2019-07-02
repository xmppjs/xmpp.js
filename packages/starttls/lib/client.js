'use strict'

const xml = require('@xmpp/xml')
const tls = require('tls')

/*
 * References
 * https://xmpp.org/rfcs/rfc6120.html#tls
 */

const NS = 'urn:ietf:params:xml:ns:xmpp-tls'

function proceed(entity, options = {}) {
  return new Promise((resolve, reject) => {
    const tlsSocket = tls.connect(
      {socket: entity._detachSocket(), host: entity.options.domain, ...options},
      err => {
        if (err) return reject(err)
        entity._attachSocket(tlsSocket)
        resolve()
      }
    )
  })
}

async function starttls(entity) {
  const element = await entity.sendReceive(xml('starttls', {xmlns: NS}))
  if (element.is('proceed', NS)) {
    return element
  }

  throw new Error('STARTTLS_FAILURE')
}

module.exports = function({streamFeatures}) {
  return streamFeatures.use('starttls', NS, async ({entity}) => {
    await starttls(entity)
    await proceed(entity)
    await entity.restart()
  })
}
