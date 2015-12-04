'use strict'

var Element = require('node-xmpp-core').Element
var crypto = require('crypto')
var debug = require('debug')('xmpp:s2s:util:dialbackkey')

/*
 * Returns the stanzas as defined in XEP-0185
 *
 * http://xmpp.org/extensions/xep-0185.html
 */
function DialbackKey () {
  this.secret = 's3cr3tf0rd14lb4ck'
}

/**
 * generate hmac according to http://xmpp.org/extensions/xep-0185.html
 */
DialbackKey.prototype.generateHMAC = function (recievingsrv, originatingsrv, streamid) {
  var shasum = crypto.createHash('sha256')
  shasum.update(this.secret)
  var shakey = shasum.digest('hex')
  var text = recievingsrv + ' ' + originatingsrv + ' ' + streamid
  var hash = crypto.createHmac('sha256', shakey).update(text).digest('hex')
  debug(hash)
  return hash
}

DialbackKey.prototype.dialbackKey = function (from, to, key) {
  return new Element('db:result', {
    to: to,
    from: from
  }).t(key)
}

DialbackKey.prototype.dialbackVerify = function (from, to, id, key) {
  return new Element('db:verify', {
    to: to,
    from: from,
    id: id
  }).t(key)
}

DialbackKey.prototype.dialbackVerified = function (from, to, id, isValid) {
  return new Element('db:verify', {
    to: to,
    from: from,
    id: id,
    type: isValid ? 'valid' : 'invalid'
  })
}

DialbackKey.prototype.dialbackResult = function (from, to, isValid) {
  return new Element('db:result', {
    to: to,
    from: from,
    type: isValid ? 'valid' : 'invalid'
  })
}

module.exports = new DialbackKey()
