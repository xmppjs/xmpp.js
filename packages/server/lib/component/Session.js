'use strict'

const crypto = require('crypto')
const { EventEmitter } = require('@xmpp/events')
const Connection = require('@xmpp/connection')
const jid = require('@xmpp/jid')
const { Element } = require('@xmpp/xml')

class ComponentSession extends EventEmitter {
  constructor({connection, socket}) {
    super()
    this.connection = connection || new Connection()
    this._addConnectionListeners()
    this.connection.xmlns[''] = this.NS_COMPONENT
    this.connection.xmlns.stream = this.NS_STREAM
    if (this.connection.connect) {
      this.connection.connect({ socket })
    }
  }

  onStreamStart(streamAttrs) {
    if (streamAttrs.xmlns !== this.NS_COMPONENT) {
      this.connection.error('invalid-namespace', `invalid namespace '${streamAttrs.xmlns}'`)
      return
    }

    const self = this
    this.jid = jid(streamAttrs.to)
    this.emit('verify-component', this.jid, (err, password) => {
      if (err) {
        self.connection.error('host-unknown', err.message || 'unknown host')
      } else {
        if (!streamAttrs.id) streamAttrs.id = Date.now()
        self.expectedDigest = self._sha1Hex((streamAttrs.id || '') + password)
        self.connection.streamAttrs = streamAttrs
        self.connection.startStream()
      }
    })
  }

  onStanza(stanza) {
    if (!stanza.is('handshake')) {
      this.emit('stanza', stanza)
      return
    }

    if (stanza.getText() === this.expectedDigest) {
      this.emit('auth-success')
      this.connection.send(new Element('handshake'))
      this.emit('online')
      this.authenticated = true
    } else {
      this.connection.error('not-authorized', 'not authorized')
    }
  }

  send(stanza) {
    this.connection.send(stanza)
  }

  end() {
    this.connection.end()
  }

  _addConnectionListeners(con = this.connection) {
    con.on('streamStart', this.onStreamStart.bind(this))
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
  }

  _sha1Hex(s) {
    const hash = crypto.createHash('sha1')
    hash.update(s)
    return hash.digest('hex')
  }
}

ComponentSession.prototype.NS_COMPONENT = 'jabber:component:accept'
ComponentSession.prototype.NS_STREAM = 'http://etherx.jabber.org/streams'

module.exports = ComponentSession
