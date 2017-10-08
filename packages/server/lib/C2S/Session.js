'use strict'

const { EventEmitter } = require('@xmpp/events')
const { Element } = require('@xmpp/xml')
const jid = require('@xmpp/jid')
const Connection = require('@xmpp/connection')
const { rack } = require('hat')

const NS_CLIENT = 'jabber:client'
const NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl'
const NS_REGISTER = 'jabber:iq:register'
const NS_SESSION = 'urn:ietf:params:xml:ns:xmpp-session'
const NS_BIND = 'urn:ietf:params:xml:ns:xmpp-bind'
const NS_STANZAS = 'urn:ietf:params:xml:ns:xmpp-stanzas'
const NS_STREAMS = 'http://etherx.jabber.org/streams'

class Session extends EventEmitter {
  constructor(opts) {
    super()

    this.authenticated = false
    this.server = opts.server
    this.generateId = rack(opts.idBits, opts.idBitsBase, opts.idBitsExpandBy)

    this.connection = opts.connection || new Connection({
      rejectUnauthorized: opts.rejectUnauthorized,
      requestCert: opts.requestCert,
      reconnect: false,
      streamOpen: opts.streamOpen,
      streamClose: opts.streamClose,
      streamAttrs: opts.streamAttrs,
    })
    this._addConnectionListeners()
    if (this.connection.xmlns) {
      this.connection.xmlns[''] = NS_CLIENT
    }
    this.connection.streamAttrs.version = '1.0'
    this.connection.streamAttrs.id = this.generateId()

    if (this.connection.connect) {
      this.connection.connect({ socket: opts.socket })
    }
  }

  _addConnectionListeners(con = this.connection) {
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
    con.on('streamStart', ({ to }) => {
      if (to === undefined) {
        this.connection.error('host-unknown', "'to' attribute missing")
      } else if (to === '') {
        this.connection.error('host-unknown', "empty 'to' attibute")
      } else {
        this.serverdomain = to
        con.streamAttrs.from = to
        this.startStream()
      }
    })
  }

  send(stanza) {
    if (stanza.root) stanza = stanza.root()
    this.connection.send(stanza)
  }

  pause() {
    if (this.connection.pause) {
      this.connection.pause()
    }
  }

  resume() {
    if (this.connection.resume) {
      this.connection.resume()
    }
  }

  end() {
    this.connection.end()
  }

  startStream() {
    if (this.connection.startStream) {
      this.connection.startStream()
    }
    this.sendFeatures()
  }

  decode64(encoded) {
    return Buffer.from(encoded, 'base64').toString('utf8')
  }

  sendFeatures() {
    // Trilian requires features to be prefixed https://github.com/node-xmpp/node-xmpp-server/pull/125
    const features = new Element('stream:features', { xmlns: NS_STREAMS, 'xmlns:stream': NS_STREAMS })
    if (this.authenticated) {
      features.c('bind', { xmlns: NS_BIND })
      features.c('session', { xmlns: NS_SESSION })
    } else {
      if (this.server && this.server.availableSaslMechanisms) {
        // TLS
        const opts = this.server.options
        if (opts && opts.tls && !this.connection.isSecure) {
          features
            .c('starttls', { xmlns: this.connection.NS_XMPP_TLS })
            .c('required')
        }
        this.mechanisms = this.server.getSaslMechanisms()
      } else {
        this.mechanisms = []
      }

      const mechanismsEl = features.c(
        'mechanisms', { xmlns: NS_XMPP_SASL })
      this.mechanisms.forEach(({ prototype: { name } }) => {
        mechanismsEl.c('mechanism').t(name)
      })
    }
    this.send(features)
  }

  onStanza(stanza) {
    if (this.jid) stanza.attrs.from = this.jid.toString()

    if (stanza.is('starttls', this.connection.NS_XMPP_TLS)) {
      const toSend = new Element(
        'proceed', { xmlns: this.connection.NS_XMPP_TLS }
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

  onAuthStanza(stanza) {
    const bind = stanza.getChild('bind', NS_BIND)
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

  sendAuthError(error) {
    if (this.jid) {
      this.emit('auth-failure', this.jid)
    }
    const message = error && error.message ? error.message : 'Authentication failure'
    const type = error && error.type ? error.type : 'not-authorized'
    this.send(new Element('failure', {
      xmlns: NS_XMPP_SASL,
    })
      .c(type).up()
      .c('text').t(message))
  }

  onAuth(stanza) {
    const self = this

    // If we havn't already decided for one method
    if (!this.mechanism) {
      const matchingMechs = this.mechanisms.filter(({ prototype: { name } }) => {
        return stanza.attrs.mechanism === name
      })

      // TODO: handle case where we are not able to match a sasl mechanism
      this.mechanism = new matchingMechs[0]()

      /**
       * Authenticates a user
       * @param  Object authRequest obejct with credentials like {user: 'bob', password: 'secret'}
       */
      this.mechanism.authenticate = (user, cb) => {
        if (!user.saslmech) {
          // Attach sasl mechanism
          user.saslmech = self.mechanism.name
        }

        if (user.jid) {
          user.jid = jid(user.jid)
        } else {
          user.jid = jid(user.username, self.serverdomain.toString())
        }
        user.client = self

        // Emit event
        self.emit('authenticate', user, cb)
      }
      this.mechanism.success = (user) => {
        self.emit('auth-success', user.jid)
        self.jid = user.jid
        self.authenticated = true
        self.send(new Element('success', { xmlns: NS_XMPP_SASL }))
        // Incoming stream restart
        if (self.connection.startParser) {
          self.connection.startParser()
        }
      }
      this.mechanism.failure = (error) => {
        self.sendAuthError(error)
      }
    }

    if (this.mechanism) {
      this.mechanism.manageAuth(stanza, this)
    }
  }

  onRegistration(stanza) {
    const self = this
    const register = stanza.getChild('query', NS_REGISTER)
    const reply = new Element('iq', { type: 'result' })
    if (stanza.attrs.id) {
      reply.attrs.id = stanza.attrs.id
    }

    if (stanza.attrs.type === 'get') {
      const instructions = 'Choose a username and password for use ' +
        'with this service. '
      reply.c('query', { xmlns: NS_REGISTER })
        .c('instructions').t(instructions).up()
        .c('username').up()
        .c('password')
      proceed()
    } else if (stanza.attrs.type === 'set') {
      const regJid = jid(register.getChildText('username'), this.server.options.domain)
      this.emit('register', {
        jid: regJid,
        username: register.getChildText('username'),
        password: register.getChildText('password'),
        client: self,
      }, (error) => {
        if (error) {
          self.emit('registration-failure', regJid)
          reply.attrs.type = 'error'
          reply
            .c('error', {
              code: String(error.code),
              type: error.type,
            })
            .c(error.condition, {
              xmlns: NS_STANZAS,
            }).up()
            .c('text', {
              xmlns: NS_STANZAS,
            })
            .t(error.message)
        } else {
          self.emit('registration-success', self.jid)
        }
        proceed()
      })
    }

    function proceed() {
      self.send(reply)
    }
  }

  onBind(stanza) {
    const self = this
    const bind = stanza.getChild('bind', NS_BIND)
    const resourceNode = bind.getChild('resource', NS_BIND)
    const resource = resourceNode ? resourceNode.getText() : null

    const sendBind = (resource) => {
      if (!resource) {
        resource = self.generateId()
      }
      self.jid.setResource(resource)

      self.send(
        new Element('iq', {
          type: 'result',
          id: stanza.attrs.id,
        })
          .c('bind', { xmlns: NS_BIND })
          .c('jid').t(self.jid.toString()))
    }

    if (self.listenerCount('bind') > 0) {
      self.emit('bind', resource, (error, resource) => {
        if (error) {
          const element = new Element('iq', {
            type: 'error',
            id: stanza.attrs.id,
          })
            .c('error', { type: error.type })
            .c(error.condition, { xmlns: NS_STANZAS })
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

  onSession(stanza) {
    const result = new Element('iq', { type: 'result', id: stanza.attrs.id })
      .c('session', { xmlns: NS_SESSION })
    this.send(result)
    this.emit('online')
  }
}

module.exports = Session
