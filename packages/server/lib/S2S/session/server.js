'use strict'

/**
 * Implements http://xmpp.org/extensions/xep-0220.html
 */
const { Element } = require('ltx')
const Connection = require('@xmpp/connection')
const StreamShaper = require('../stream/shaper')
const IdleTimeout = require('../stream/timeout')
const debug = require('debug')('xmpp:s2s:server')

const NS_SERVER = 'jabber:server'
const NS_DIALBACK = 'jabber:server:dialback'

/**
 * Dialback-specific events:
 * (1) dialbackKey(from, to, key)
 * (2) dialbackVerify(from, to, id, key)
 * (3) dialbackVerified(from, to, id, isValid)
 * (4) dialbackResult(from, to, isValid)
 */
class Server extends Connection {
  constructor(opts = {}) {
    super(opts)
    this.opts = opts

    this.xmlns[''] = NS_SERVER
    this.xmlns.db = NS_DIALBACK
    this.xmppVersion = '1.0'

    // Clients start <stream:stream>, servers reply
    this.on('connect', this.streamStart.bind(this))
  }

  setupStream(opts) {
    debug('setup stream')

    super.setupStream(opts)

    this.on('connect', (socket) => {
      StreamShaper.attach(socket, this.rateLimit)
      socket.setKeepAlive(true, this.keepAlive)
      IdleTimeout.attach(socket, this.streamTimeout)
      socket.on('timeout', function () {
        if (this.socket === socket) {
          this.error('connection-timeout')
        }
      })
    })
  }

  streamStart(opts) {
    super.startStream(opts)
  }

  // Overwrite onStanza from Connection
  onStanza(stanza) {
    let handled = false

    if (stanza.is('error', this.NS_STREAM)) {
      const error = new Error(String(getAllText(stanza)))
      error.stanza = stanza
      this.socket.emit('error', error)
      handled = true
    } else if (stanza.is('features', this.NS_STREAM) &&
      this.allowTLS &&
      !this.isSecure &&
      stanza.getChild('starttls', this.NS_XMPP_TLS)) {
      /* Signal willingness to perform TLS handshake */
      this.send(new Element('starttls', { xmlns: this.NS_XMPP_TLS }))
      handled = true
    } else if (this.allowTLS &&
      stanza.is('proceed', this.NS_XMPP_TLS)) {
      /* Server is waiting for TLS handshake */
      this.setSecure()
      handled = true
    }

    return handled
  }

  handleDialback(stanza) {
    let handled = false
    const key = stanza.getText()

    if (stanza.is('result', this.NS_DIALBACK)) {
      if (stanza.attrs.from && stanza.attrs.to &&
        stanza.attrs.type) {
        debug('dialback result')
        this.emit('dialbackResult',
          stanza.attrs.from,
          stanza.attrs.to, (stanza.attrs.type === 'valid')
        )
        handled = true
      } else if (stanza.attrs.from && stanza.attrs.to) {
        debug('dialback key')
        this.emit('dialbackKey',
          stanza.attrs.from,
          stanza.attrs.to,
          key
        )
        handled = true
      }
    } else if (stanza.is('verify', this.NS_DIALBACK)) {
      if (stanza.attrs.from && stanza.attrs.to &&
        stanza.attrs.id && stanza.attrs.type) {
        debug('dialback verified')
        this.emit('dialbackVerified',
          stanza.attrs.from,
          stanza.attrs.to,
          stanza.attrs.id, (stanza.attrs.type === 'valid')
        )
        handled = true
      } else if (stanza.attrs.from && stanza.attrs.to && stanza.attrs.id) {
        debug('dialback verify')
        this.emit('dialbackVerify',
          stanza.attrs.from,
          stanza.attrs.to,
          stanza.attrs.id,
          key
        )
        handled = true
      }
    }

    return handled
  }
}

Server.prototype.NS_SERVER = NS_SERVER
Server.prototype.NS_DIALBACK = NS_DIALBACK

function getAllText(el) {
  return el.children ? el.children.reduce((text, child) => text + getAllText(child), '')
    : el
}

module.exports = Server
