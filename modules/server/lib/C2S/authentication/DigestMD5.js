'use strict'

var util = require('util')
var crypto = require('crypto')
var Element = require('node-xmpp-core').Element
var Mechanism = require('./Mechanism')
var JID = require('node-xmpp-core').JID

/**
 * Hash a string
 */
function md5 (s, encoding) {
  var hash = crypto.createHash('md5')
  hash.update(s)
  return hash.digest(encoding || 'binary')
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
      result[m[1]] = m[2].replace(/\"/g, '')
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

var NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl'

/**
 * @see http://tools.ietf.org/html/rfc2831
 * @see http://wiki.xmpp.org/web/SASLandDIGEST-MD5
 */
function DigestMD5 (domain) {
  this.nonce = generateNonce()
  this.nonceCount = 0
  this.authcid = null
  this.actAs = null
  this.realm = null
  this.algorithm = 'md5-sess'
  this.charset = 'utf-8'
  this.qop = 'auth'
  this.domain = domain
}

util.inherits(DigestMD5, Mechanism)

DigestMD5.prototype.name = 'DIGEST-MD5'
DigestMD5.id = 'DIGEST-MD5'

DigestMD5.prototype.manage = true

DigestMD5.prototype.auth = function () {
  return ''
}

DigestMD5.prototype.getNC = function () {
  return rjust(this.nonceCount.toString(), 8, '0')
}

DigestMD5.prototype.responseValue = function (s, password) {
  var dict = parseDict(s)
  if (dict.realm) {
    this.realm = dict.realm
  }

  var value
  if (dict.nonce && dict.qop) {
    this.nonceCount++
    var a1 = md5(this.authcid + ':' +
        this.realm + ':' +
        password) + ':' +
      dict.nonce + ':' +
      this.cnonce

    if (this.actAs) a1 += ':' + this.actAs

    var a2 = 'AUTHENTICATE:' + this.digestUri
    if ((dict.qop === 'auth-int') || (dict.qop === 'auth-conf')) {
      a2 += ':00000000000000000000000000000000'
    }

    value = md5Hex(md5Hex(a1) + ':' +
      dict.nonce + ':' +
      ((this.nc) ? this.nc : this.getNC()) + ':' +
      this.cnonce + ':' +
      dict.qop + ':' +
      md5Hex(a2))
  }
  return value
}

DigestMD5.prototype.serverChallenge = function () {
  var dict = {}
  dict.realm = this.domain
  this.nonce = dict.nonce = generateNonce()
  dict.qop = 'auth'
  this.charset = dict.charset = 'utf-8'
  dict.algorithm = 'md5-sess'
  return new Buffer(encodeDict(dict)).toString('base64')
}

// Used on the server to check for auth!
DigestMD5.prototype.checkResponse = function (s) {
  var dict = parseDict(s)
  this.authcid = this.username = dict.username

  this.digestUri = dict['digest-uri']
  if (dict.nonce !== this.nonce) return false
  if (!dict.cnonce) return false

  // dict['serv-type'] should be xmpp

  if (dict.nc) {
    this.nc = dict.nc
  }
  this.cnonce = dict.cnonce
  if (this.charset !== dict.charset) return false

  this.response = dict.response
  return true
}

DigestMD5.prototype.manageAuth = function (stanza, server) {
  if (stanza.is('auth', NS_XMPP_SASL)) {
    // send initial challenge to client
    var challenge = new Element('challenge', {
      xmlns: NS_XMPP_SASL
    }).t(this.serverChallenge())
    server.send(challenge)
  } else if (stanza.is('response', NS_XMPP_SASL) && stanza.getText() !== '') {
    // response from client with challenge
    var responseValid = this.checkResponse(new Buffer(stanza.getText(), 'base64'))
    var self = this
    if (responseValid) {
      var user = {
        'username': self.authcid
      }
      this.authenticate(user, function (err, user) {
        // send final challenge and wait for response from user
        if (self.response === self.responseValue(new Buffer(stanza.getText(), 'base64'), user.password)) {
          var challenge = new Element('challenge', {
            xmlns: NS_XMPP_SASL
          })
            .t(new Buffer('rspauth=ea40f60335c427b5527b84dbabcdfffd').toString('base64'))
          server.send(challenge)
          delete user.password
          self.user = user
        } else {
          // no authenticated <response xmlns='urn:ietf:params:xml:ns:xmpp-sasl'/>
          self.failure(err)
        }
      })
    } else {
      // error if we are not able to authenticate the user
      self.failure(new Error('Invalid response'))
    }
  } else if (stanza.is('response', NS_XMPP_SASL) && this.user) {
    // here we are successfully authenticated and are able to call the callback
    this.success(this.user)
  } else if (stanza.is('response', NS_XMPP_SASL)) {
    // client wants to skip mechanism steps
    this.failure(new Error('Invalid response'))
  }
}

DigestMD5.prototype.loginFailed = function (server) {
  var jid = false
  if (this.username) {
    jid = new JID(this.username, server.serverdomain ? server.serverdomain.toString() : '')
  }

  server.emit('auth-failure', jid)
  server.send(new Element('response', {
    xmlns: NS_XMPP_SASL
  }))
}

module.exports = DigestMD5
