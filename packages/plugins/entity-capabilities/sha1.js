'use strict'

const crypto = require('crypto')
const c = global.crypto || global.msCrypto || {}
const subtle = c.subtle || c.webkitSubtle
const {TextEncoder, btoa} = global

if (!crypto.createHash) {
  if (!subtle) {
    throw new Error(
      'crypto.subtle unavailable http://xmppjs.org/plugins/entity-capabilities'
    )
  }

  if (!TextEncoder) {
    throw new Error(
      'TextEncoder unavailable http://xmppjs.org/plugins/entity-capabilities'
    )
  }
}

module.exports = function sha1(s) {
  if (crypto.createHash) {
    return Promise.resolve(
      crypto
        .createHash('sha1')
        .update(s)
        .digest('base64')
    )
  }

  return subtle.digest('SHA-1', new TextEncoder('utf-8').encode(s)).then(b => {
    return btoa(String.fromCharCode(...new Uint8Array(b)))
  })
}
