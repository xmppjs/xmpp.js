'use strict'

const xml = require('@xmpp/xml')
const streamfeatures = require('../stream-features')
const tls = require('tls')

/*
 * References
 * https://xmpp.org/rfcs/rfc6120.html#tls
 */

const NS = 'urn:ietf:params:xml:ns:xmpp-tls'

function match (features) {
  return features.getChild('starttls', NS)
}

function proceed(entity, options) {
  return new Promise((resolve, reject) => {
    options.socket = entity.socket.socket
    const tlsSocket = tls.connect(options, function (err) {
      if (err) return reject(err)
      entity.socket._detachSocket()
      entity.socket._attachSocket(tlsSocket)
      resolve()
    })
  })
}

function starttls (entity) {
  return entity.socket.sendReceive(xml`<starttls xmlns='${NS}'/>`).then((element) => {
    if (element.is('failure', NS)) {
      throw new Error('STARTTLS_FAILURE')
    } else if (element.is('proceed', NS)) {
      return new Promise((resolve, reject) => {
        if (!entity.listenerCount('starttls')) {
          proceed(entity, {}).then(resolve).catch(reject)
        } else {
          entity.emit('starttls', (options) => {
            proceed(entity, options).then(resolve).catch(reject)
          })
        }
      })
    }
  })
}

module.exports.name = 'starttls'
module.exports.plugin = function plugin(entity) {
  const streamFeature = {
    priority: 5000,
    match,
    restart: true,
    run: (entity) => {
      return starttls(entity)
    }
  }

  const streamFeatures = entity.plugin(streamfeatures)
  streamFeatures.add(streamFeature)
  return {
    entity
  }
}
