'use strict'

var Session = require('./session')
var core = require('node-xmpp-core')
var JID = core.JID
var Stanza = core.Stanza
var inherits = core.inherits
var sasl = require('./sasl')
var Anonymous = require('./authentication/anonymous')
var Plain = require('./authentication/plain')
var DigestMD5 = require('./authentication/digestmd5')
var XOAuth2 = require('./authentication/xoauth2')
var External = require('./authentication/external')
var exec = require('child_process').exec
var debug = require('debug')('xmpp:client')

var NS_CLIENT = 'jabber:client'
var NS_REGISTER = 'jabber:iq:register'
var NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl'
var NS_XMPP_BIND = 'urn:ietf:params:xml:ns:xmpp-bind'
var NS_XMPP_SESSION = 'urn:ietf:params:xml:ns:xmpp-session'

var STATE_PREAUTH = 0
var STATE_AUTH = 1
var STATE_AUTHED = 2
var STATE_BIND = 3
var STATE_SESSION = 4
var STATE_ONLINE = 5

var IQID_SESSION = 'sess'
var IQID_BIND = 'bind'

var decode64, encode64, Buffer
if (typeof btoa === 'undefined') {
  var btoa = null
  var atob = null
}

if (typeof btoa === 'function') {
  decode64 = function (encoded) {
    return atob(encoded)
  }
} else {
  Buffer = require('buffer').Buffer
  decode64 = function (encoded) {
    return (new Buffer(encoded, 'base64')).toString('utf8')
  }
}
if (typeof atob === 'function') {
  encode64 = function (decoded) {
    return btoa(decoded)
  }
} else {
  Buffer = require('buffer').Buffer
  encode64 = function (decoded) {
    return (new Buffer(decoded, 'utf8')).toString('base64')
  }
}

/**
 * params object:
 *   jid: String (required)
 *   password: String (required)
 *   host: String (optional)
 *   port: Number (optional)
 *   reconnect: Boolean (optional)
 *   autostart: Boolean (optional) - if we start connecting to a given port
 *   register: Boolean (option) - register account before authentication
 *   legacySSL: Boolean (optional) - connect to the legacy SSL port, requires at least the host to be specified
 *   credentials: Dictionary (optional) - TLS or SSL key and certificate credentials
 *   actAs: String (optional) - if admin user act on behalf of another user (just user)
 *   disallowTLS: Boolean (optional) - prevent upgrading the connection to a secure one via TLS
 *   preferred: String (optional) - Preferred SASL mechanism to use
 *   bosh.url: String (optional) - BOSH endpoint to use
 *   bosh.prebind: Function(error, data) (optional) - Just prebind a new BOSH session for browser client use
 *            error String - Result of XMPP error. Ex : [Error: XMPP authentication failure]
 *            data Object - Result of XMPP BOSH connection.
 *
 * Examples:
 *   var cl = new xmpp.Client({
 *       jid: "me@example.com",
 *       password: "secret"
 *   })
 *   var gtalk = new xmpp.Client({
 *       jid: 'me@gmail.com',
 *       oauth2_token: 'xxxx.xxxxxxxxxxx', // from OAuth2
 *       oauth2_auth: 'http://www.google.com/talk/protocol/auth',
 *       host: 'talk.google.com'
 *   })
 *   var prebind = new xmpp.Client({
 *       jid: "me@example.com",
 *       password: "secret",
 *       bosh: {
 *           url: "http://example.com/http-bind",
 *           prebind: function(error, data) {
 *               if (error) {}
 *               res.send({ rid: data.rid, sid: data.sid })
 *           }
 *       }
 *   })
 *
 * Example SASL EXTERNAL:
 *
 * var myCredentials = {
 *   // These are necessary only if using the client certificate authentication
 *   key: fs.readFileSync('key.pem'),
 *   cert: fs.readFileSync('cert.pem'),
 *   // passphrase: 'optional'
 * }
 * var cl = new xmppClient({
 *     jid: "me@example.com",
 *     credentials: myCredentials
 *     preferred: 'EXTERNAL' // not really required, but possible
 * })
 *
 */
function Client (options) {
  this.options = {}
  if (options) this.options = options
  this.availableSaslMechanisms = [
    XOAuth2, External, DigestMD5, Plain, Anonymous
  ]

  if (this.options.autostart !== false) this.connect()
}

inherits(Client, Session)

Client.NS_CLIENT = NS_CLIENT

Client.prototype.connect = function () {
  if (this.options.bosh && this.options.bosh.prebind) {
    return this._connectViaBosh()
  }
  this._useStandardConnect()
}

Client.prototype._useStandardConnect = function () {
  this.options.xmlns = NS_CLIENT
  delete this.did_bind
  delete this.did_session

  this.state = STATE_PREAUTH
  this.on('end', function () {
    this.state = STATE_PREAUTH
    delete this.did_bind
    delete this.did_session
  })

  Session.call(this, this.options)
  this.options.jid = this.jid

  this.connection.on('disconnect', function (error) {
    this.state = STATE_PREAUTH
    if (!this.connection.reconnect) {
      if (error) this.emit('error', error)
      this.emit('offline')
    }
    delete this.did_bind
    delete this.did_session
  }.bind(this))

  /* If server and client have multiple possible auth mechanisms
   * we try to select the preferred one
   */
  if (this.options.preferred) {
    this.preferredSaslMechanism = this.options.preferred
  } else {
    this.preferredSaslMechanism = 'DIGEST-MD5'
  }

  var mechs = sasl.detectMechanisms(this.options, this.availableSaslMechanisms)
  this.availableSaslMechanisms = mechs
}

Client.prototype._connectViaBosh = function () {
  debug('load bosh prebind')
  var cb = this.options.bosh.prebind
  delete this.options.bosh.prebind
  var cmd = 'node ' + __dirname +
    '/prebind.js '
  delete this.options.bosh.prebind
  cmd += encodeURI(JSON.stringify(this.options))
  exec(
    cmd,
    function (error, stdout, stderr) {
      if (error) {
        cb(error, null)
      } else {
        var r = stdout.match(/rid:+[ 0-9]*/i)
        var s = stdout.match(/sid:+[ a-z+'"-_A-Z+0-9]*/i)
        if (!r || !s) {
          return cb(stderr)
        }
        r = (r[0].split(':'))[1].trim()

        s = (s[0].split(':'))[1]
          .replace("'", '')
          .replace("'", '')
          .trim()
        if (r && s) {
          return cb(null, { rid: r, sid: s })
        }
        cb(stderr)
      }
    }
  )
}

Client.prototype.onStanza = function (stanza) {
  /* Actually, we shouldn't wait for <stream:features/> if
   * this.streamAttrs.version is missing, but who uses pre-XMPP-1.0
   * these days anyway?
   */
  if (stanza.name === 'stream:error') {
    return this._handleStreamError(stanza)
  }
  if ((this.state !== STATE_ONLINE) && stanza.is('features')) {
    this.streamFeatures = stanza
    return this.useFeatures()
  }
  this._handleStanza(stanza)
}

Client.prototype._handleStanza = function (stanza) {
  switch (this.state) {
    case STATE_ONLINE:
      this.emit('stanza', stanza)
      break
    case STATE_PREAUTH:
      this.emit('stanza:preauth', stanza)
      break
    case STATE_AUTH:
      this._handleAuthState(stanza)
      break
    case STATE_BIND:
      if (stanza.is('iq') && (stanza.attrs.id === IQID_BIND)) {
        this._handleBindState(stanza)
      }
      break
    case STATE_SESSION:
      if ((stanza.is('iq') === true) && (stanza.attrs.id === IQID_SESSION)) {
        this._handleSessionState(stanza)
      }
      break
  }
}

Client.prototype._handleStreamError = function (stanza) {
  if (!this.reconnect) {
    this.emit('error', stanza)
  }
}

Client.prototype._handleSessionState = function (stanza) {
  if (stanza.attrs.type === 'result') {
    this.state = STATE_AUTHED
    this.did_session = true

    /* no stream restart, but next feature (most probably
       we'll go online next) */
    this.useFeatures()
  } else {
    this.emit('error', 'Cannot bind resource')
  }
}

Client.prototype._handleBindState = function (stanza) {
  if (stanza.attrs.type === 'result') {
    this.state = STATE_AUTHED
    this.did_bind = true

    var bindEl = stanza.getChild('bind', NS_XMPP_BIND)
    if (bindEl && bindEl.getChild('jid')) {
      this.jid = new JID(bindEl.getChild('jid').getText())
    }

    /* no stream restart, but next feature */
    this.useFeatures()
  } else {
    this.emit('error', 'Cannot bind resource')
  }
}

Client.prototype._handleAuthState = function (stanza) {
  if (stanza.is('challenge', NS_XMPP_SASL)) {
    var challengeMsg = decode64(stanza.getText())
    var responseMsg = encode64(this.mech.challenge(challengeMsg))
    var response = new Stanza.Element(
      'response', { xmlns: NS_XMPP_SASL }
    ).t(responseMsg)
    this.send(response)
  } else if (stanza.is('success', NS_XMPP_SASL)) {
    this.mech = null
    this.state = STATE_AUTHED
    this.emit('auth')
  } else {
    this.emit('error', 'XMPP authentication failure')
  }
}

Client.prototype._handlePreAuthState = function () {
  this.state = STATE_AUTH
  var offeredMechs = this.streamFeatures.getChild('mechanisms', NS_XMPP_SASL).getChildren('mechanism', NS_XMPP_SASL).map(function (el) { return el.getText() })
  this.mech = sasl.selectMechanism(
    offeredMechs,
    this.preferredSaslMechanism,
    this.availableSaslMechanisms
  )
  if (this.mech) {
    this.mech.authzid = this.jid.bare().toString()
    this.mech.authcid = this.jid.local
    this.mech.password = this.password
    this.mech.api_key = this.api_key
    this.mech.access_token = this.access_token
    this.mech.oauth2_token = this.oauth2_token
    this.mech.oauth2_auth = this.oauth2_auth
    this.mech.realm = this.jid.domain // anything?
    if (this.actAs) this.mech.actAs = this.actAs.user
    this.mech.digest_uri = 'xmpp/' + this.jid.domain
    var authMsg = encode64(this.mech.auth())
    var attrs = this.mech.authAttrs()
    attrs.xmlns = NS_XMPP_SASL
    attrs.mechanism = this.mech.name
    this.send(new Stanza.Element('auth', attrs)
      .t(authMsg))
  } else {
    this.emit('error', new Error('No usable SASL mechanism'))
  }
}

/**
 * Either we just received <stream:features/>, or we just enabled a
 * feature and are looking for the next.
 */
Client.prototype.useFeatures = function () {
  if ((this.state === STATE_PREAUTH) && this.register) {
    delete this.register
    this.doRegister()
  } else if ((this.state === STATE_PREAUTH) &&
    this.streamFeatures.getChild('mechanisms', NS_XMPP_SASL)) {
    this._handlePreAuthState()
  } else if ((this.state === STATE_AUTHED) &&
    !this.did_bind &&
    this.streamFeatures.getChild('bind', NS_XMPP_BIND)) {
    this.state = STATE_BIND
    var bindEl = new Stanza.Element('iq', {
      type: 'set',
      id: IQID_BIND
    }).c('bind', { xmlns: NS_XMPP_BIND })
    if (this.jid.resource) {
      bindEl.c('resource').t(this.jid.resource)
    }
    this.send(bindEl)
  } else if ((this.state === STATE_AUTHED) &&
    !this.did_session &&
    this.streamFeatures.getChild('session', NS_XMPP_SESSION)) {
    this.state = STATE_SESSION
    var stanza = new Stanza.Element('iq', {
      type: 'set',
      to: this.jid.domain,
      id: IQID_SESSION
    }).c('session', { xmlns: NS_XMPP_SESSION })
    this.send(stanza)
  } else if (this.state === STATE_AUTHED) {
    /* Ok, we're authenticated and all features have been
       processed */
    this.state = STATE_ONLINE
    this.emit('online', { jid: this.jid })
  }
}

Client.prototype.doRegister = function () {
  var id = 'register' + Math.ceil(Math.random() * 99999)
  var iq = new Stanza.Element(
    'iq',
    { type: 'set', id: id, to: this.jid.domain }
  ).c('query', { xmlns: NS_REGISTER })
    .c('username').t(this.jid.local).up()
    .c('password').t(this.password)
  this.send(iq)

  var self = this
  var onReply = function (reply) {
    if (reply.is('iq') && (reply.attrs.id === id)) {
      self.removeListener('stanza', onReply)

      if (reply.attrs.type === 'result') {
        /* Registration successful, proceed to auth */
        self.useFeatures()
      } else {
        self.emit('error', new Error('Registration error'))
      }
    }
  }
  this.on('stanza:preauth', onReply)
}

/**
 * returns all registered sasl mechanisms
 */
Client.prototype.getSaslMechanisms = function () {
  return this.availableSaslMechanisms
}

/**
 * removes all registered sasl mechanisms
 */
Client.prototype.clearSaslMechanism = function () {
  this.availableSaslMechanisms = []
}

/**
 * register a new sasl mechanism
 */
Client.prototype.registerSaslMechanism = function (method) {
  // check if method is registered
  if (this.availableSaslMechanisms.indexOf(method) === -1) {
    this.availableSaslMechanisms.push(method)
  }
}

/**
 * unregister an existing sasl mechanism
 */
Client.prototype.unregisterSaslMechanism = function (method) {
  // check if method is registered
  var index = this.availableSaslMechanisms.indexOf(method)
  if (index >= 0) {
    this.availableSaslMechanisms = this.availableSaslMechanisms.splice(index, 1)
  }
}

module.exports = Client
