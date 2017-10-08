'use strict'

/*
 * Implements http://tools.ietf.org/html/rfc3920#section-14.4
 */
const fs = require('fs')
const net = require('net')
const util = require('util')
const tls = require('tls')
const EventEmitter = require('events').EventEmitter
const rack = require('hat').rack
const JID = require('node-xmpp-core').JID
const DomainContext = require('./domaincontext')
const nameprep = require('./util/nameprep')
const dialbackkey = require('./util/dialbackkey')
const IncomingServer = require('./session/incoming')
const debug = require('debug')('xmpp:s2s:router')

/**
 * Accepts incoming S2S connections. Handles routing of outgoing
 * stanzas, and allows you to register a handler
 * for your own domain.
 */
class Router extends EventEmitter {
  constructor(s2sPort, bindAddress, opts) {
    super()
    this.ctxs = {}

    opts = opts || {}

    this.generateId = rack(opts.idBits, opts.idBitsBase, opts.idBitsExpandBy)

    if (opts.secureDomains && opts.secureDomains.length) {
      opts.secureDomains.forEach(this.addSecureDomain, this)
    }

    // Start tcp socket
    this._server = net.createServer((socket) => {
      this.acceptConnection(socket)
    }).listen(s2sPort || 5269, bindAddress || '::')
  }

  close(callback) {
    debug('closing server')
    this._server.close(callback)
  }

  /*
   * Little helper, because dealing with crypto & fs gets unwieldy
   */
  loadCredentials(domain, key, cert, ca) {
    const creds = {
      key,
      cert,
      ca,
    }
    this.getContext(domain).setCredentials(tls.createSecureContext(creds))
  }

  loadCredentialsFromFile(domain, keyPath, certPath, caPath) {
    const key = fs.readFileSync(keyPath, 'ascii')
    const cert = fs.readFileSync(certPath, 'ascii')
    const ca = caPath ? fs.readFileSync(caPath, 'ascii') : undefined

    this.loadCredentials(domain, key, cert, ca)
  }

  addSecureDomain(domain) {
    this.getContext(nameprep(domain)).secureDomain = true
  }

  /*
   * Handles a new socket connection
   */
  acceptConnection(socket) {
    debug(`accept a new connection: ${socket}`)
    const self = this

    const inStream = new IncomingServer({
      streamId: this.generateId(),
      reconnect: false,
      requestCert: true,
      socket,
    })

    // Send features supported by this domain
    inStream.on('streamStart', (attrs) => {
      inStream.fromDomain = nameprep(attrs.from)
      inStream.toDomain = nameprep(attrs.to)
      const domainContext = self.getContext(inStream.toDomain)
      const credentials = domainContext.credentials
      if (credentials) {
        inStream.opts.tls = true
        inStream.credentials = credentials
        inStream.secureDomain = domainContext.secureDomain
      }
      inStream.sendFeatures()
    })

    inStream.on('auth', (type) => {
      if (type === 'SASL') {
        inStream.onSASLAuth()
      }
      self.getContext(inStream.toDomain).addInStream(inStream.fromDomain, inStream)
    })

    // Incoming server wants to verify an outgoing connection of ours
    inStream.on('dialbackVerify', (from, to, id, key) => {
      from = nameprep(from)
      to = nameprep(to)
      if (self.hasContext(to)) {
        self.getContext(to).verifyDialback(from, id, key, (isValid) => {
          // Look if this was a connection of ours
          inStream.send(dialbackkey.dialbackVerified(to, from, id, isValid))
        })
      } else {
        // We don't host the 'to' domain
        inStream.send(dialbackkey.dialbackVerified(to, from, id, false))
      }
    })

    // Incoming connection wants to get verified
    inStream.on('dialbackKey', (from, to, key) => {
      from = nameprep(from)
      to = nameprep(to)
      if (self.hasContext(to)) {
        // Trigger verification via outgoing connection
        self.getContext(to).verifyIncoming(from, inStream, key)
      } else {
        inStream.error('host-unknown', `${to} is not served here`)
      }
    })
    return inStream
  }

  /**
   * Create domain context & register a stanza listener callback
   */
  register(domain, listener) {
    domain = nameprep(domain)
    debug(`register a new domain: ${domain}`)
    this.getContext(domain).stanzaListener = listener
  }

  /**
   * Unregister a context and stop its connections
   */
  unregister(domain) {
    debug(`unregister a domain: ${domain}`)
    if (this.hasContext(domain)) {
      this.ctxs[domain].end()

      delete this.ctxs[domain]
    }
  }

  send(stanza) {
    debug(`send: ${stanza.root().toString()}`)

    if (stanza.root) {
      stanza = stanza.root()
    }

    const to = stanza.attrs && stanza.attrs.to
    const toDomain = to && (new JID(to)).getDomain()
    if (toDomain && this.hasContext(toDomain)) {
      debug('inner routing')
      // Inner routing
      this.getContext(toDomain).receive(stanza)
    } else if (stanza.attrs && stanza.attrs.from) {
      debug('s2s routing')
      // Route to domain context for s2s
      const domain = (new JID(stanza.attrs.from)).getDomain()
      this.getContext(domain).send(stanza)
    } else {
      throw new Error('Sending stanza from a domain we do not host')
    }
  }

  hasContext(domain) {
    return this.ctxs.hasOwnProperty(domain)
  }

  getContext(domain) {
    if (this.ctxs.hasOwnProperty(domain)) {
      return this.ctxs[domain]
    }
    this.ctxs[domain] = new DomainContext(this, domain)
    return this.ctxs[domain]

  }
}

// Defaults
Router.prototype.rateLimit = 100 // 100 KB/s, it's S2S after all
Router.prototype.maxStanzaSize = 65536 // 64 KB, by convention
Router.prototype.keepAlive = 30 * 1000 // 30s
Router.prototype.streamTimeout = 5 * 60 * 1000 // 5min
Router.prototype.credentials = {} // TLS credentials per domain

module.exports = Router
