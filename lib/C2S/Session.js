'use strict'

var EventEmitter = require('events').EventEmitter
var util = require('util')
var core = require('node-xmpp-core')
var Element = core.Element
var JID = core.JID
var IQ = core.IQ
var Connection = core.Connection
var rack = require('hat').rack

var NS_CLIENT = 'jabber:client'
var NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl'
var NS_REGISTER = 'jabber:iq:register'
var NS_SESSION = 'urn:ietf:params:xml:ns:xmpp-session'
var NS_BIND = 'urn:ietf:params:xml:ns:xmpp-bind'
var NS_STANZAS = 'urn:ietf:params:xml:ns:xmpp-stanzas'
var NS_STREAMS = 'http://etherx.jabber.org/streams'

function Session (opts) {
  this.authenticated = false
  this.server = opts.server
  this.generateId = rack(opts.idBits, opts.idBitsBase, opts.idBitsExpandBy)

  this.connection = opts.connection || new Connection({
    rejectUnauthorized: opts.rejectUnauthorized,
    requestCert: opts.requestCert,
    reconnect: false,
    streamOpen: opts.streamOpen,
    streamClose: opts.streamClose,
    streamAttrs: opts.streamAttrs
  })
  this._addConnectionListeners()
  if (this.connection.xmlns) {
    this.connection.xmlns[''] = NS_CLIENT
  }
  this.connection.streamAttrs.version = '1.0'
  this.connection.streamAttrs.id = this.generateId()

  if (this.connection.connect) {
    this.connection.connect({socket: opts.socket})
  }
}

util.inherits(Session, EventEmitter)

Session.prototype._addConnectionListeners = function (con) {
  con = con || this.connection
  con.on('stanza', this.onStanza.bind(this))
  con.on('drain', this.emit.bind(this, 'drain'))
  con.on('data', this.emit.bind(this, 'data'))
  con.on('end', this.emit.bind(this, 'end'))
  con.on('close', this.emit.bind(this, 'close'))
  con.on('error', this.emit.bind(this, 'error'))
  con.on('connect', this.emit.bind(this, 'connect'))
  con.on('reconnect', this.emit.bind(this, 'reconnect'))
  con.on('disconnect', this.emit.bind(this, 'disconnect'))
  con.on('disconnect', this.emit.bind(this, 'offline'))
  con.on('streamStart', function (attrs) {
    if (attrs.to === undefined) {
      this.connection.error('host-unknown', "'to' attribute missing")
    } else if (attrs.to === '') {
      this.connection.error('host-unknown', "empty 'to' attibute")
    } else {
      this.serverdomain = attrs.to
      con.streamAttrs.from = attrs.to
      this.startStream()
    }
  }.bind(this))
}

Session.prototype.send = function (stanza) {
  if (stanza.root) stanza = stanza.root()
  this.connection.send(stanza)
}

Session.prototype.pause = function () {
  if (this.connection.pause) {
    this.connection.pause()
  }
}

Session.prototype.resume = function () {
  if (this.connection.resume) {
    this.connection.resume()
  }
}

Session.prototype.end = function () {
  this.connection.end()
}

Session.prototype.startStream = function () {
  if (this.connection.startStream) {
    this.connection.startStream()
  }
  this.sendFeatures()
}

Session.prototype.decode64 = function (encoded) {
  return (new Buffer(encoded, 'base64')).toString('utf8')
}

Session.prototype.sendFeatures = function () {
  var features = new Element('features', {'xmlns': NS_STREAMS})
  if (!this.authenticated) {
    if (this.server && this.server.availableSaslMechanisms) {
      // TLS
      var opts = this.server.options
      if (opts && opts.tls && !this.connection.isSecure) {
        features
          .c('starttls', {
            xmlns: this.connection.NS_XMPP_TLS
          })
          .c('required')
      }
      this.mechanisms = this.server.getSaslMechanisms()
    } else {
      this.mechanisms = []
    }

    var mechanismsEl = features.c(
      'mechanisms', {
        xmlns: NS_XMPP_SASL
      })
    this.mechanisms.forEach(function (mech) {
      mechanismsEl.c('mechanism').t(mech.prototype.name)
    })
  } else {
    features.c('bind', {
      xmlns: NS_BIND
    })
    features.c('session', {
      xmlns: NS_SESSION
    })
  }
  this.send(features)
}

Session.prototype.onStanza = function (stanza) {
  if (this.jid) stanza.attrs.from = this.jid.toString()

  if (stanza.is('starttls', this.connection.NS_XMPP_TLS)) {
    var toSend = new Element(
      'proceed', {
        xmlns: this.connection.NS_XMPP_TLS
      }
    )
    this.send(toSend)
    this.connection.setSecure(this.server.credentials, true)
  } else if (stanza.is('auth', NS_XMPP_SASL) || stanza.is('response', NS_XMPP_SASL)) {
    this.onAuth(stanza)
  } else if (stanza.is('iq') && stanza.getChild('query', NS_REGISTER)) {
    this.onRegistration(stanza)
  } else if (this.authenticated) {
    this.onAuthStanza(stanza)
  }
}

Session.prototype.onAuthStanza = function (stanza) {
  var bind = stanza.getChild('bind', NS_BIND)
  if (stanza.is('iq') &&
    (stanza.attrs.type === 'set') &&
    (bind)) {
    this.onBind(stanza)
  } else if (stanza.is('iq') &&
    (stanza.attrs.type === 'set') &&
    stanza.getChild('session', NS_SESSION)) {
    this.onSession(stanza)
  } else {
    this.emit('stanza', stanza)
  }
}

Session.prototype.sendAuthError = function (error) {
  if (this.jid) {
    this.emit('auth-failure', this.jid)
  }
  var message = error && error.message ? error.message : 'Authentication failure'
  var type = error && error.type ? error.type : 'not-authorized'
  this.send(new Element('failure', {
    xmlns: NS_XMPP_SASL
  })
    .c(type).up()
    .c('text').t(message))
}

Session.prototype.onAuth = function (stanza) {
  var self = this

  // if we havn't already decided for one method
  if (!this.mechanism) {
    var matchingMechs = this.mechanisms.filter(function (mech) {
      return mech.prototype.name === stanza.attrs.mechanism
    })

    // TODO handle case where we are not able to match a sasl mechanism
    this.mechanism = new matchingMechs[0]()

    /**
     * Authenticates a user
     * @param  Object authRequest obejct with credentials like {user: 'bob', password: 'secret'}
     */
    this.mechanism.authenticate = function (user, cb) {
      if (!user.saslmech) {
        // attach sasl mechanism
        user.saslmech = self.mechanism.name
      }

      if (user.jid) {
        user.jid = new JID(user.jid)
      } else {
        user.jid = new JID(user.username, self.serverdomain.toString())
      }
      user.client = self

      // emit event
      self.emit('authenticate', user, cb)
    }
    this.mechanism.success = function (user) {
      self.emit('auth-success', user.jid)
      self.jid = user.jid
      self.authenticated = true
      self.send(new Element('success', {
        xmlns: NS_XMPP_SASL
      }))
      // incoming stream restart
      if (self.connection.startParser) {
        self.connection.startParser()
      }
    }
    this.mechanism.failure = function (error) {
      self.sendAuthError(error)
    }
  }

  if (this.mechanism) {
    this.mechanism.manageAuth(stanza, this)
  }
}

Session.prototype.onRegistration = function (stanza) {
  var self = this
  var register = stanza.getChild('query', NS_REGISTER)
  var reply = new Element('iq', {
    type: 'result'
  })
  if (stanza.attrs.id) {
    reply.attrs.id = stanza.attrs.id
  }

  if (stanza.attrs.type === 'get') {
    var instructions = 'Choose a username and password for use ' +
      'with this service. '
    reply.c('query', {
      xmlns: NS_REGISTER
    })
      .c('instructions').t(instructions).up()
      .c('username').up()
      .c('password')
    proceed()
  } else if (stanza.attrs.type === 'set') {
    var jid = new JID(register.getChildText('username'), this.server.options.domain)
    this.emit('register', {
      jid: jid,
      username: register.getChildText('username'),
      password: register.getChildText('password'),
      client: self
    }, function (error) {
      if (!error) {
        self.emit('registration-success', self.jid)
      } else {
        self.emit('registration-failure', jid)
        reply.attrs.type = 'error'
        reply
          .c('error', {
            code: '' + error.code,
            type: error.type
          })
          .c(error.condition, {
            xmlns: NS_STANZAS
          }).up()
          .c('text', {
            xmlns: NS_STANZAS
          })
          .t(error.message)
      }
      proceed()
    })
  }

  function proceed () {
    self.send(reply)
  }
}

Session.prototype.onBind = function (stanza) {
  var self = this
  var bind = stanza.getChild('bind', NS_BIND)
  var resourceNode = bind.getChild('resource', NS_BIND)
  var resource = resourceNode ? resourceNode.getText() : null

  var sendBind = function (resource) {
    if (!resource) {
      resource = self.generateId()
    }
    self.jid.setResource(resource)

    self.send(
      new Element('iq', {
        type: 'result',
        id: stanza.attrs.id
      })
        .c('bind', {
          xmlns: NS_BIND
        })
        .c('jid').t(self.jid.toString()))
  }

  var listenerCount = 0
  if (typeof EventEmitter.listenerCount !== 'undefined') {
    listenerCount = EventEmitter.listenerCount(self, 'bind')
  } else {
    listenerCount = this.listeners('bind').length
  }
  if (listenerCount > 0) {
    self.emit('bind', resource, function (error, resource) {
      if (error) {
        var element = new Element('iq', {
          type: 'error',
          id: stanza.attrs.id
        })
          .c('error', {
            type: error.type
          })
          .c(error.condition, {
            xmlns: NS_STANZAS
          })
        if (error.text) {
          element.t(error.text)
        }
        self.send(element)
      } else {
        sendBind(resource)
      }
    })
  } else {
    sendBind(resource)
  }
}

Session.prototype.onSession = function (stanza) {
  var result = new IQ({type: 'result', id: stanza.attrs.id})
    .c('session', {xmlns: NS_SESSION})
  this.send(result)
  this.emit('online')
}

module.exports = Session
