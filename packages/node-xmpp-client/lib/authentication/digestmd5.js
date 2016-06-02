'use strict'

var inherits = require('node-xmpp-core').inherits
var Mechanism = require('./mechanism')
var crypto = require('crypto')
var MD5 = require('md5.js')

/**
 * Hash a string
 */
function md5 (s, encoding) {
  // we ignore crypto in the browser field of package.json
  var hash = crypto.createHash ? crypto.createHash('md5') : new MD5()
  return hash.update(s, 'binary').digest(encoding || 'binary')
}
function md5Hex (s) {
  return md5(s, 'hex')
}

/**
 * Parse SASL serialization
 */
function parseDict (s) {
  var result = {}
  while (s) {
    var m
    if ((m = /^(.+?)=(.*?[^\\]),\s*(.*)/.exec(s))) {
      result[m[1]] = m[2].replace(/"/g, '')
      s = m[3]
    } else if ((m = /^(.+?)=(.+?),\s*(.*)/.exec(s))) {
      result[m[1]] = m[2]
      s = m[3]
    } else if ((m = /^(.+?)="(.*?[^\\])"$/.exec(s))) {
      result[m[1]] = m[2]
      s = m[3]
    } else if ((m = /^(.+?)=(.+?)$/.exec(s))) {
      result[m[1]] = m[2]
      s = m[3]
    } else {
      s = null
    }
  }
  return result
}

/**
 * SASL serialization
 */
function encodeDict (dict) {
  var s = ''
  for (var k in dict) {
    var v = dict[k]
    if (v) s += ',' + k + '="' + v + '"'
  }
  return s.substr(1) // without first ','
}

/**
 * Right-justify a string,
 * eg. pad with 0s
 */
function rjust (s, targetLen, padding) {
  while (s.length < targetLen) {
    s = padding + s
  }
  return s
}

/**
 * Generate a string of 8 digits
 * (number used once)
 */
function generateNonce () {
  var result = ''
  for (var i = 0; i < 8; i++) {
    result += String.fromCharCode(48 +
      Math.ceil(Math.random() * 10))
  }
  return result
}

/**
 * @see http://tools.ietf.org/html/rfc2831
 * @see http://wiki.xmpp.org/web/SASLandDIGEST-MD5
 */
function DigestMD5 () {
  this.nonce_count = 0
  this.cnonce = generateNonce()
  this.authcid = null
  this.actAs = null
  this.realm = null
  this.password = null
}

inherits(DigestMD5, Mechanism)

DigestMD5.prototype.name = 'DIGEST-MD5'

DigestMD5.prototype.auth = function () {
  return ''
}

DigestMD5.prototype.getNC = function () {
  return rjust(this.nonce_count.toString(), 8, '0')
}

DigestMD5.prototype.responseValue = function (s) {
  var dict = parseDict(s)
  if (dict.realm) {
    this.realm = dict.realm
  }

  var value
  if (dict.nonce && dict.qop) {
    this.nonce_count++
    var a1 = md5(this.authcid + ':' +
        this.realm + ':' +
        this.password) + ':' +
      dict.nonce + ':' +
      this.cnonce
    if (this.actAs) a1 += ':' + this.actAs

    var a2 = 'AUTHENTICATE:' + this.digest_uri
    if ((dict.qop === 'auth-int') || (dict.qop === 'auth-conf')) {
      a2 += ':00000000000000000000000000000000'
    }

    value = md5Hex(md5Hex(a1) + ':' +
      dict.nonce + ':' +
      this.getNC() + ':' +
      this.cnonce + ':' +
      dict.qop + ':' +
      md5Hex(a2))
  }
  return value
}

DigestMD5.prototype.challenge = function (s) {
  var dict = parseDict(s)
  if (dict.realm) {
    this.realm = dict.realm
  }

  var response
  if (dict.nonce && dict.qop) {
    var responseValue = this.responseValue(s)
    response = {
      username: this.authcid,
      realm: this.realm,
      nonce: dict.nonce,
      cnonce: this.cnonce,
      nc: this.getNC(),
      qop: dict.qop,
      'digest-uri': this.digest_uri,
      response: responseValue,
      charset: 'utf-8'
    }
    if (this.actAs) response.authzid = this.actAs
  } else if (dict.rspauth) {
    return ''
  }
  return encodeDict(response)
}

DigestMD5.prototype.serverChallenge = function () {
  var dict = {}
  dict.realm = ''
  this.nonce = dict.nonce = generateNonce()
  dict.qop = 'auth'
  this.charset = dict.charset = 'utf-8'
  dict.algorithm = 'md5-sess'
  return encodeDict(dict)
}

// Used on the server to check for auth!
DigestMD5.prototype.response = function (s) {
  var dict = parseDict(s)
  this.authcid = dict.username

  if (dict.nonce !== this.nonce) return false
  if (!dict.cnonce) return false

  this.cnonce = dict.cnonce
  if (this.charset !== dict.charset) return false

  this.response = dict.response
  return true
}

DigestMD5.prototype.match = function (options) {
  if (options.password) return true
  return false
}

module.exports = DigestMD5
