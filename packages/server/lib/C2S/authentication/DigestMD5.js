'use strict'

const util = require('util')
const crypto = require('crypto')
const Element = require('node-xmpp-core').Element
const Mechanism = require('./Mechanism')
const JID = require('node-xmpp-core').JID

/**
 * Hash a string
 */
function md5 (s, encoding) {
  const hash = crypto.createHash('md5')
  hash.update(s, 'binary')
  return hash.digest(encoding || 'binary')
}
function md5Hex (s) {
  return md5(s, 'hex')
}

/**
 * Parse SASL serialization
 */
function parseDict (s) {
  const result = {}
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
  let s = ''
  for (const k in dict) {
    const v = dict[k]
    if (v) s += ',' + k + '="' + v + '"'
  }
  return s.substr(1) // Without first ','
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
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += String.fromCharCode(48 +
      Math.ceil(Math.random() * 10))
  }
  return result
}

const NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl'

/**
 * @see http://tools.ietf.org/html/rfc2831
 * @see http://wiki.xmpp.org/web/SASLandDIGEST-MD5
 */
class DigestMD5 extends Mechanism {
  constructor(domain) {
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

  auth() {
    return ''
  }

  getNC() {
    return rjust(this.nonceCount.toString(), 8, '0')
  }

  responseValue(s, password) {
    const dict = parseDict(s)
    if (dict.realm) {
      this.realm = dict.realm
    }

    let value
    if (dict.nonce && dict.qop) {
      this.nonceCount++
      let a1 = md5(this.authcid + ':' +
          this.realm + ':' +
          password) + ':' +
        dict.nonce + ':' +
        this.cnonce

      if (this.actAs) a1 += ':' + this.actAs

      let a2 = 'AUTHENTICATE:' + this.digestUri
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

  serverChallenge() {
    const dict = {}
    dict.realm = this.domain
    this.nonce = dict.nonce = generateNonce()
    dict.qop = 'auth'
    this.charset = dict.charset = 'utf-8'
    dict.algorithm = 'md5-sess'
    return Buffer.from(encodeDict(dict)).toString('base64')
  }

  // Used on the server to check for auth!
  checkResponse(s) {
    const dict = parseDict(s)
    this.authcid = this.username = dict.username

    this.digestUri = dict['digest-uri']
    if (dict.nonce !== this.nonce) return false
    if (!dict.cnonce) return false

    // Dict['serv-type'] should be xmpp

    if (dict.nc) {
      this.nc = dict.nc
    }
    this.cnonce = dict.cnonce
    if (this.charset !== dict.charset) return false

    this.response = dict.response
    return true
  }

  manageAuth(stanza, server) {
    if (stanza.is('auth', NS_XMPP_SASL)) {
      // Send initial challenge to client
      const challenge = new Element('challenge', {
        xmlns: NS_XMPP_SASL,
      }).t(this.serverChallenge())
      server.send(challenge)
    } else if (stanza.is('response', NS_XMPP_SASL) && stanza.getText() !== '') {
      // Response from client with challenge
      const responseValid = this.checkResponse(Buffer.from(stanza.getText(), 'base64'))
      const self = this
      if (responseValid) {
        const user = {
          'username': self.authcid,
        }
        this.authenticate(user, (err, user) => {
          // Send final challenge and wait for response from user
          if (self.response === self.responseValue(Buffer.from(stanza.getText(), 'base64'), user.password)) {
            const challenge = new Element('challenge', {
              xmlns: NS_XMPP_SASL,
            })
              .t(Buffer.from('rspauth=ea40f60335c427b5527b84dbabcdfffd').toString('base64'))
            server.send(challenge)
            delete user.password
            self.user = user
          } else {
            // No authenticated <response xmlns='urn:ietf:params:xml:ns:xmpp-sasl'/>
            self.failure(err)
          }
        })
      } else {
        // Error if we are not able to authenticate the user
        self.failure(new Error('Invalid response'))
      }
    } else if (stanza.is('response', NS_XMPP_SASL) && this.user) {
      // Here we are successfully authenticated and are able to call the callback
      this.success(this.user)
    } else if (stanza.is('response', NS_XMPP_SASL)) {
      // Client wants to skip mechanism steps
      this.failure(new Error('Invalid response'))
    }
  }

  loginFailed(server) {
    let jid = false
    if (this.username) {
      jid = new JID(this.username, server.serverdomain ? server.serverdomain.toString() : '')
    }

    server.emit('auth-failure', jid)
    server.send(new Element('response', {
      xmlns: NS_XMPP_SASL,
    }))
  }
}

DigestMD5.prototype.name = 'DIGEST-MD5'
DigestMD5.id = 'DIGEST-MD5'

DigestMD5.prototype.manage = true

module.exports = DigestMD5
