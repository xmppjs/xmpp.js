'use strict'

/*
 * Implements http://tools.ietf.org/html/rfc3920#section-14.4
 */
var fs = require('fs')
var net = require('net')
var util = require('util')
var tls = require('tls')
var EventEmitter = require('events').EventEmitter
var rack = require('hat').rack
var JID = require('node-xmpp-core').JID
var DomainContext = require('./domaincontext')
var nameprep = require('./util/nameprep')
var dialbackkey = require('./util/dialbackkey')
var IncomingServer = require('./session/incoming')
var debug = require('debug')('xmpp:s2s:router')

/**
 * Accepts incoming S2S connections. Handles routing of outgoing
 * stanzas, and allows you to register a handler
 * for your own domain.
 */
function Router (s2sPort, bindAddress, opts) {
  EventEmitter.call(this)
  this.ctxs = {}

  opts = opts || {}

  this.generateId = rack(opts.idBits, opts.idBitsBase, opts.idBitsExpandBy)

  if (opts.secureDomains && opts.secureDomains.length) {
    opts.secureDomains.forEach(this.addSecureDomain, this)
  }

  // start tcp socket
  this._server = net.createServer(function (socket) {
    this.acceptConnection(socket)
  }.bind(this)).listen(s2sPort || 5269, bindAddress || '::')
}

util.inherits(Router, EventEmitter)

// Defaults
Router.prototype.rateLimit = 100 // 100 KB/s, it's S2S after all
Router.prototype.maxStanzaSize = 65536 // 64 KB, by convention
Router.prototype.keepAlive = 30 * 1000 // 30s
Router.prototype.streamTimeout = 5 * 60 * 1000 // 5min
Router.prototype.credentials = {} // TLS credentials per domain

Router.prototype.close = function (callback) {
  debug('closing server')
  this._server.close(callback)
}

/*
 * little helper, because dealing with crypto & fs gets unwieldy
 */
Router.prototype.loadCredentials = function (domain, key, cert, ca) {
  var creds = {
    key: key,
    cert: cert,
    ca: ca
  }
  this.getContext(domain).setCredentials(tls.createSecureContext(creds))
}

Router.prototype.loadCredentialsFromFile = function (domain, keyPath, certPath, caPath) {
  var key = fs.readFileSync(keyPath, 'ascii')
  var cert = fs.readFileSync(certPath, 'ascii')
  var ca = caPath ? fs.readFileSync(caPath, 'ascii') : undefined

  this.loadCredentials(domain, key, cert, ca)
}

Router.prototype.addSecureDomain = function (domain) {
  this.getContext(nameprep(domain)).secureDomain = true
}

/*
 * handles a new socket connection
 */
Router.prototype.acceptConnection = function (socket) {
  debug('accept a new connection' + socket)
  var self = this

  var inStream = new IncomingServer({
    streamId: this.generateId(),
    reconnect: false,
    requestCert: true,
    socket: socket
  })

  // send features supported by this domain
  inStream.on('streamStart', function (attrs) {
    inStream.fromDomain = nameprep(attrs.from)
    inStream.toDomain = nameprep(attrs.to)
    var domainContext = self.getContext(inStream.toDomain)
    var credentials = domainContext.credentials
    if (credentials) {
      inStream.opts.tls = true
      inStream.credentials = credentials
      inStream.secureDomain = domainContext.secureDomain
    }
    inStream.sendFeatures()
  })

  inStream.on('auth', function (type) {
    if (type === 'SASL') {
      inStream.onSASLAuth()
    }
    self.getContext(inStream.toDomain).addInStream(inStream.fromDomain, inStream)
  })

  // incoming server wants to verify an outgoing connection of ours
  inStream.on('dialbackVerify', function (from, to, id, key) {
    from = nameprep(from)
    to = nameprep(to)
    if (self.hasContext(to)) {
      self.getContext(to).verifyDialback(from, id, key, function (isValid) {
        // look if this was a connection of ours
        inStream.send(dialbackkey.dialbackVerified(to, from, id, isValid))
      })
    } else {
      // we don't host the 'to' domain
      inStream.send(dialbackkey.dialbackVerified(to, from, id, false))
    }
  })

  // incoming connection wants to get verified
  inStream.on('dialbackKey', function (from, to, key) {
    from = nameprep(from)
    to = nameprep(to)
    if (self.hasContext(to)) {
      // trigger verification via outgoing connection
      self.getContext(to).verifyIncoming(from, inStream, key)
    } else {
      inStream.error('host-unknown', to + ' is not served here')
    }
  })
  return inStream
}

/**
 * Create domain context & register a stanza listener callback
 */
Router.prototype.register = function (domain, listener) {
  domain = nameprep(domain)
  debug('register a new domain: ' + domain)
  this.getContext(domain).stanzaListener = listener
}

/**
 * Unregister a context and stop its connections
 */
Router.prototype.unregister = function (domain) {
  debug('unregister a domain: ' + domain)
  if (this.hasContext(domain)) {
    this.ctxs[domain].end()

    delete this.ctxs[domain]
  }
}

Router.prototype.send = function (stanza) {
  debug('send: ' + stanza.root().toString())

  if (stanza.root) {
    stanza = stanza.root()
  }

  var to = stanza.attrs && stanza.attrs.to
  var toDomain = to && (new JID(to)).getDomain()
  if (toDomain && this.hasContext(toDomain)) {
    debug('inner routing')
    // inner routing
    this.getContext(toDomain).receive(stanza)
  } else if (stanza.attrs && stanza.attrs.from) {
    debug('s2s routing')
    // route to domain context for s2s
    var domain = (new JID(stanza.attrs.from)).getDomain()
    this.getContext(domain).send(stanza)
  } else {
    throw new Error('Sending stanza from a domain we do not host')
  }
}

Router.prototype.hasContext = function (domain) {
  return this.ctxs.hasOwnProperty(domain)
}

Router.prototype.getContext = function (domain) {
  if (this.ctxs.hasOwnProperty(domain)) {
    return this.ctxs[domain]
  } else {
    this.ctxs[domain] = new DomainContext(this, domain)
    return this.ctxs[domain]
  }
}

module.exports = Router
