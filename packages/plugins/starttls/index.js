'use strict'

const xml = require('@xmpp/xml')
const streamfeatures = require('../stream-features')
const tls = require('tls')
const net = require('net')

/*
 * References
 * https://xmpp.org/rfcs/rfc6120.html#tls
 */

const NS = 'urn:ietf:params:xml:ns:xmpp-tls'

function match(features, entity) {
  return features.getChild('starttls', NS) &&
    entity.socket.Socket === net.Socket // https://prosody.im/issues/issue/837
}

function proceed(entity, options) {
  return new Promise((resolve, reject) => {
    options.socket = entity.socket.socket
    entity.socket._detachSocket()
    const tlsSocket = tls.connect(options, err => {
      if (err) {
        return reject(err)
      }
      entity.socket._attachSocket(tlsSocket)
      resolve()
    })
  })
}

function starttls(entity) {
  return entity.socket.sendReceive(xml('starttls', {xmlns: NS})).then(element => {
    if (element.is('failure', NS)) {
      throw new Error('STARTTLS_FAILURE')
    } else if (element.is('proceed', NS)) {
      return proceed(entity, {})
    }
  })
}

module.exports.name = 'starttls'
module.exports.plugin = function plugin(entity) {
  const streamFeature = {
    name: 'starttls',
    priority: 5000,
    match,
    restart: true,
    run: entity => {
      return starttls(entity)
    },
  }

  const streamFeatures = entity.plugin(streamfeatures)
  streamFeatures.add(streamFeature)
  return {
    entity,
  }
}
