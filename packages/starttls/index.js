'use strict'

const xml = require('@xmpp/xml')
const tls = require('tls')
const net = require('net')

/*
 * References
 * https://xmpp.org/rfcs/rfc6120.html#tls
 */

const NS = 'urn:ietf:params:xml:ns:xmpp-tls'

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

function starttls(entity) {
  return entity.sendReceive(xml('starttls', {xmlns: NS})).then(element => {
    if (element.is('failure', NS)) {
      throw new Error('STARTTLS_FAILURE')
    } else if (element.is('proceed', NS)) {
      return proceed(entity, {})
    }
  })
}

function route() {
  return function({entity}, next) {
    // https://prosody.im/issues/issue/837
    if (entity.socket.constructor !== net.Socket) return next()
    return starttls(entity).then(() => {
      return entity.restart()
    })
  }
}

module.exports.proceed = proceed
module.exports.starttls = starttls
module.exports.route = route
module.exports.streamFeature = function() {
  return ['starttls', NS, route()]
}
