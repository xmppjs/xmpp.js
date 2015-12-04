'use strict'

/*
 * Implements http://tools.ietf.org/html/rfc3920#section-14.4
 */
var fs = require('fs')
var net = require('net')
var util = require('util')
var crypto = require('crypto')
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
 *
 * TODO:
 * * Incoming SASL EXTERNAL with certificate validation
 */
function Router (s2sPort, bindAddress, opts) {
  EventEmitter.call(this)
  this.ctxs = {}

  opts = opts || {}

  this.generateId = rack(opts.idBits, opts.idBitsBase, opts.idBitsExpandBy)

  // start tcp socket
  net.createServer(function (socket) {
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

/*
 * little helper, because dealing with crypto & fs gets unwieldy
 */
Router.prototype.loadCredentials = function (domain, key, cert) {
  var creds = crypto.createCredentials({
    key: key,
    cert: cert
  })

  this.getContext(domain).setCredentials(creds)
}

Router.prototype.loadCredentialsFromFile = function (domain, keyPath, certPath) {
  var key = fs.readFileSync(keyPath, 'ascii')
  var cert = fs.readFileSync(certPath, 'ascii')

  this.loadCredentials(domain, key, cert)
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
    socket: socket
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
