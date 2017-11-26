'use strict'

const xml = require('@xmpp/xml')
const tls = require('tls')
const net = require('net')

/*
 * References
 * https://xmpp.org/rfcs/rfc6120.html#tls
 */

const NS = 'urn:ietf:params:xml:ns:xmpp-tls'

function match(features, entity) {
  return (
    features.getChild('starttls', NS) &&
    entity.socket.constructor === net.Socket
  ) // https://prosody.im/issues/issue/837
}

function proceed(entity, options) {
  return new Promise((resolve, reject) => {
    options.socket = entity.socket
    entity._detachSocket()
    const tlsSocket = tls.connect(options, err => {
      if (err) {
        return reject(err)
      }
      entity._attachSocket(tlsSocket)
      resolve()
    })
  })
}

function _starttls(entity) {
  return entity.sendReceive(xml('starttls', {xmlns: NS})).then(element => {
    if (element.is('failure', NS)) {
      throw new Error('STARTTLS_FAILURE')
    } else if (element.is('proceed', NS)) {
      return proceed(entity, {})
    }
  })
}

module.exports = function starttls(streamFeatures) {
  const {entity} = streamFeatures

  streamFeatures.use({
    name: 'starttls',
    priority: 5000,
    match,
    restart: true,
    run: () => {
      return _starttls(entity)
    },
  })

  return {
    streamFeatures,
    entity,
  }
}
