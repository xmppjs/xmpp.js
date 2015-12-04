'use strict'

var JID = require('node-xmpp-core').JID
var Element = require('node-xmpp-core').Element
var nameprep = require('./util/nameprep')
var dialbackkey = require('./util/dialbackkey')
var OutgoingServer = require('./session/outgoing')
var debug = require('debug')('xmpp:s2s:domainctx')

var NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl'
var NS_XMPP_STANZAS = 'urn:ietf:params:xml:ns:xmpp-stanzas'

/**
 * Represents a domain we host with connections to federated servers
 */
function DomainContext (router, domain) {
  // own domains
  this.domain = domain

  // attached routers
  this.router = router

  // store certificate
  this.credentials = null

  // s2s connections
  this.s2sIn = {}
  this.s2sOut = {}
}

/**
 * stores the credentials per domain
 */
DomainContext.prototype.setCredentials = function (credentials) {
  this.credentials = credentials
}

/**
 * Buffers until stream has been verified via Dialback
 */
DomainContext.prototype.send = function (stanza) {
  if (stanza.root) {
    stanza = stanza.root()
  }

  // no destination? return to ourself
  if (!stanza.attrs.to) {
    // do not provoke ping-pong effects
    if (stanza.attrs.type === 'error') {
      return
    }

    stanza.attrs.to = stanza.attrs.from
    delete stanza.attrs.from
    stanza.attrs.type = 'error'
    stanza.c('error', {
      type: 'modify'
    }).c('jid-malformed', {
      xmlns: NS_XMPP_STANZAS
    })
    this.receive(stanza)

    return
  }

  // route stanza
  var destDomain = new JID(stanza.attrs.to).domain
  // get stream for suiteable s2s connection
  var outStream = this.getOutStream(destDomain)

  if (outStream.isAuthed) {
    outStream.send(stanza)
  } else {
    debug('queue the message')
    // TODO: queues per domain in domaincontext
    outStream.queue = outStream.queue || []
    outStream.queue.push(stanza)
  }
}

/**
 * Does only buffer until stream is established, used for Dialback
 * communication itself.
 *
 * returns the stream
 */
DomainContext.prototype.sendRaw = function (stanza, destDomain) {
  if (stanza.root) {
    stanza = stanza.root()
  }

  var outStream = this.getOutStream(destDomain)
  var send = function () {
    outStream.send(stanza)
  }

  if (outStream.isConnected) {
    send()
  } else {
    outStream.once('online', send)
  }

  return outStream
}

/*
 * establishes a new S2S connection
 */
DomainContext.prototype.establishS2SStream = function (destDomain) {
  debug('establish a new S2S stream')
  var self = this

  // Setup a new outgoing connection
  var outStream = new OutgoingServer(this.domain, destDomain, this.credentials)
  this.s2sOut[destDomain] = outStream
  this.setupStream(destDomain, outStream)

  var closeCb = function () {
    // purge queue
    if (outStream.queue) {
      outStream.queue.forEach(function (stanza) {
        // do not provoke ping-pong effects
        if (stanza.attrs.type === 'error') {
          return
        }

        var dest = stanza.attrs.to
        stanza.attrs.to = stanza.attrs.from
        stanza.attrs.from = dest
        stanza.attrs.type = 'error'
        stanza.c('error', {
          type: 'cancel'
        }).c('remote-server-not-found', {
          xmlns: NS_XMPP_STANZAS
        })
        self.receive(stanza)
      })
    }
    delete outStream.queue

    // remove from DomainContext
    delete self.s2sOut[destDomain]
  }
  outStream.on('close', closeCb)
  outStream.on('error', closeCb)

  var onAuth = function (method) {
    debug('onAuth')
    outStream.isConnected = true
    switch (method) {
      case 'dialback':
        self.startDialback(destDomain, outStream)
        break

      case 'external':
        outStream.send(new Element('auth', {
          xmlns: NS_XMPP_SASL,
          mechanism: 'EXTERNAL'
        }).t(new Buffer(self.domain).toString('base64')))
        var onStanza
        onStanza = function (stanza) {
          if (stanza.is('success', NS_XMPP_SASL)) {
            outStream.startStream()
            outStream.removeListener('stanza', onStanza)
            var onStream
            onStream = function () {
              outStream.emit('online')
              outStream.removeListener('streamStart', onStream)
            }
            outStream.on('streamStart', onStream)
          } else if (stanza.is('failure', NS_XMPP_SASL)) {
            outStream.end()
          }
        }
        outStream.on('stanza', onStanza)
        break

      default:
        outStream.error('undefined-condition',
          'Cannot authenticate via ' + method)
    }
    outStream.removeListener('auth', onAuth)
  }
  outStream.on('auth', onAuth)

  outStream.on('online', function () {
    debug('online')
    outStream.isAuthed = true
    if (outStream.queue) {
      outStream.queue.forEach(function (stanza) {
        outStream.send(stanza)
      })
      delete outStream.queue
    }
  })

  return outStream
}

/**
 * Establish outgoing stream on demand
 * @param string destdomain domain of a jid
 */
DomainContext.prototype.getOutStream = function (destDomain) {
  // according to the spec we cannot use the incoming streams

  if (!destDomain) {
    throw new Error('Trying to reach empty domain')
  // There's one already
  } else if (this.s2sOut.hasOwnProperty(destDomain)) {
    return this.s2sOut[destDomain]
  // establish a new connection
  } else {
    return this.establishS2SStream(destDomain)
  }
}

/**
 * Called by router when verification is done
 */
DomainContext.prototype.addInStream = function (srcDomain, stream) {
  var self = this

  if (this.s2sIn.hasOwnProperty(srcDomain)) {
    // Replace old
    var oldStream = this.s2sIn[srcDomain]
    oldStream.error('conflict', 'Connection replaced')
    delete self.s2sIn[srcDomain]
  }

  // check if we have the tls certificate
  if (this.credentials) {
    stream.credentials = this.credentials
    stream.opts.tls = true
  }

  this.setupStream(srcDomain, stream)
  stream.isConnected = true
  stream.isAuthed = true
  var closeCb = function () {
    if (self.s2sIn[srcDomain] === stream) {
      delete self.s2sIn[srcDomain]
    }
  }
  stream.on('close', closeCb)
  stream.on('error', closeCb)
  this.s2sIn[srcDomain] = stream
}

DomainContext.prototype.setupStream = function (domain, stream) {
  debug('setup new stream')
  var self = this

  stream.on('stanza', function (stanza) {
    // Before verified they can send whatever they want
    if (!stream.isAuthed) {
      return
    }

    if (stanza.name !== 'message' &&
      stanza.name !== 'presence' &&
      stanza.name !== 'iq') {
      // no normal stanza
      return
    }

    if (!(typeof stanza.attrs.from === 'string' &&
      typeof stanza.attrs.to === 'string')) {
      stream.error('improper-addressing')
      return
    }

    // Only accept 'from' attribute JIDs that have the same domain
    // that we validated the stream for
    var fromDomain = (new JID(stanza.attrs.from)).domain
    if (fromDomain !== domain) {
      stream.error('invalid-from')
      return
    }

    // Only accept 'to' attribute JIDs to this DomainContext
    var toDomain = (new JID(stanza.attrs.to)).domain
    if (toDomain !== self.domain) {
      stream.error('improper-addressing')
      return
    }

    self.receive(stanza)
  })
}

/*
 * we want to get our outgoing connection verified, sends <db:result/>
 */
DomainContext.prototype.startDialback = function (destDomain, outStream) {
  debug('start a dialback')
  outStream.dbKey = dialbackkey.generateHMAC(this.domain, destDomain, outStream.streamId)
  outStream.send(dialbackkey.dialbackKey(this.domain, destDomain, outStream.dbKey))

  var self = this
  var onResult = function (from, to, isValid) {
    if ((from !== destDomain) ||
      (to !== self.domain)) {
      // not for us
      return
    }

    outStream.removeListener('dialbackResult', onResult)
    if (isValid) {
      outStream.emit('online')
    } else {
      // we cannot do anything else with this stream that
      // failed dialback
      outStream.end()
    }
  }
  outStream.on('dialbackResult', onResult)
}

/*
 * incoming verification request for our outgoing connection that came
 * in via an inbound server connection
 */
DomainContext.prototype.verifyDialback = function (domain, id, key, cb) {
  var self = this
  var outStream
  if (this.s2sOut.hasOwnProperty(domain) &&
    (outStream = this.s2sOut[domain])) {
    if (outStream.isConnected) {
      debug('verify key:' + outStream.dbKey + ' ' + key)
      debug('compare id:' + outStream.streamId + ' ' + id)
      var isValid = outStream.streamId === id &&
        outStream.dbKey === key
      cb(isValid)
    } else {
      // Not online, wait for outStream.streamAttrs
      // (they may have our stream header & dialback key, but
      // our slow connection hasn't received their stream
      // header)
      outStream.on('online', function () {
        // recurse
        self.verifyDialback(domain, id, key, cb)
      })
      outStream.on('close', function () {
        cb(false)
      })
    }
  } else {
    cb(false)
  }
}

DomainContext.prototype.verifyIncoming = function (fromDomain, inStream, dbKey) {
  var self = this
  debug('verify incoming streamid: ' + inStream.streamId)
  var outStream = this.sendRaw(dialbackkey.dialbackVerify(this.domain, fromDomain,
    inStream.streamId, dbKey),
    fromDomain)

  // these are needed before for removeListener()
  var onVerified = function (from, to, id, isValid) {
    from = nameprep(from)
    to = nameprep(to)
    if ((from !== fromDomain) ||
      (to !== self.domain) ||
      (id !== inStream.streamId)) {
      // not for us
      return
    }
    // tell them about it
    inStream.send(dialbackkey.dialbackResult(to, from, isValid))

    if (isValid) {
      // finally validated them!
      self.addInStream(from, inStream)
    } else {
      // the connection isn't used for another domain, so
      // closing is safe
      inStream.send('</stream:stream>')
      inStream.end()
    }

    rmCbs()
  }
  var onClose = function () {
    // outgoing connection didn't work out, tell the incoming
    // connection
    inStream.send(dialbackkey.dialbackResult(self.domain, fromDomain, false))

    rmCbs()
  }
  var onCloseIn = function () {
    // t'was the incoming stream that wanted to get
    // verified, nothing to do remains

    rmCbs()
  }
  var rmCbs = function () {
    outStream.removeListener('dialbackVerified', onVerified)
    outStream.removeListener('close', onClose)
    inStream.removeListener('close', onCloseIn)
  }
  outStream.on('dialbackVerified', onVerified)
  outStream.on('close', onClose)
  inStream.on('close', onCloseIn)
}

DomainContext.prototype.receive = function (stanza) {
  if (this.stanzaListener) {
    this.stanzaListener(stanza)
  }
}

DomainContext.prototype.end = function () {
  debug('close connection')
  var shutdown = function (conns) {
    for (var domain in conns) {
      if (conns.hasOwnProperty(domain)) {
        conns[domain].end()
      }
    }
  }
  shutdown(this.s2sOut)
  shutdown(this.s2sIn)
}

module.exports = DomainContext
