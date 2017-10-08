'use strict'

const Element = require('node-xmpp-core').Element
const crypto = require('crypto')
const debug = require('debug')('xmpp:s2s:util:dialbackkey')

/*
 * Returns the stanzas as defined in XEP-0185
 *
 * http://xmpp.org/extensions/xep-0185.html
 */
class DialbackKey {
  constructor() {
    this.secret = crypto.randomBytes(256).toString('hex')
  }

  /**
   * Generate hmac according to http://xmpp.org/extensions/xep-0185.html
   */
  generateHMAC(recievingsrv, originatingsrv, streamid) {
    const shasum = crypto.createHash('sha256')
    shasum.update(this.secret)
    const shakey = shasum.digest('hex')
    const text = recievingsrv + ' ' + originatingsrv + ' ' + streamid
    const hash = crypto.createHmac('sha256', shakey).update(text).digest('hex')
    debug(hash)
    return hash
  }

  dialbackKey(from, to, key) {
    return new Element('db:result', {
      to,
      from,
    }).t(key)
  }

  dialbackVerify(from, to, id, key) {
    return new Element('db:verify', {
      to,
      from,
      id,
    }).t(key)
  }

  dialbackVerified(from, to, id, isValid) {
    return new Element('db:verify', {
      to,
      from,
      id,
      type: isValid ? 'valid' : 'invalid',
    })
  }

  dialbackResult(from, to, isValid) {
    return new Element('db:result', {
      to,
      from,
      type: isValid ? 'valid' : 'invalid',
    })
  }
}

module.exports = new DialbackKey()
