'use strict'

const JID = require('node-xmpp-core').JID
const Element = require('node-xmpp-core').Element
const nameprep = require('./util/nameprep')
const dialbackkey = require('./util/dialbackkey')
const OutgoingServer = require('./session/outgoing')
const debug = require('debug')('xmpp:s2s:domainctx')

const NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl'
const NS_XMPP_STANZAS = 'urn:ietf:params:xml:ns:xmpp-stanzas'

/**
 * Represents a domain we host with connections to federated servers
 */
function DomainContext (router, domain) {
  // Own domains
  this.domain = domain

  // Attached routers
  this.router = router

  // Store certificate
  this.credentials = null

  // S2s connections
  this.s2sIn = {}
  this.s2sOut = {}
}

/**
 * Stores the credentials per domain
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

  // No destination? return to ourself
  if (!stanza.attrs.to) {
    // Do not provoke ping-pong effects
    if (stanza.attrs.type === 'error') {
      return
    }

    stanza.attrs.to = stanza.attrs.from
    delete stanza.attrs.from
    stanza.attrs.type = 'error'
    stanza.c('error', {
      type: 'modify',
    }).c('jid-malformed', {
      xmlns: NS_XMPP_STANZAS,
    })
    this.receive(stanza)

    return
  }

  // Route stanza
  const destDomain = new JID(stanza.attrs.to).domain
  // Get stream for suiteable s2s connection
  const outStream = this.getOutStream(destDomain)

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

  const outStream = this.getOutStream(destDomain)
  const send = function () {
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
 * Establishes a new S2S connection
 */
DomainContext.prototype.establishS2SStream = function (destDomain) {
  debug('establish a new S2S stream')
  const self = this

  // Setup a new outgoing connection
  const outStream = new OutgoingServer(this.domain, destDomain, this.credentials)
  this.s2sOut[destDomain] = outStream
  this.setupStream(destDomain, outStream)

  const closeCb = function () {
    // Purge queue
    if (outStream.queue) {
      outStream.queue.forEach((stanza) => {
        // Do not provoke ping-pong effects
        if (stanza.attrs.type === 'error') {
          return
        }

        const dest = stanza.attrs.to
        stanza.attrs.to = stanza.attrs.from
        stanza.attrs.from = dest
        stanza.attrs.type = 'error'
        stanza.c('error', {
          type: 'cancel',
        }).c('remote-server-not-found', {
          xmlns: NS_XMPP_STANZAS,
        })
        self.receive(stanza)
      })
    }
    delete outStream.queue

    // Remove from DomainContext
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
        mechanism: 'EXTERNAL',
      }).t(Buffer.from(self.domain).toString('base64')))
      var onStanza
      onStanza = function (stanza) {
        if (stanza.is('success', NS_XMPP_SASL)) {
          outStream.startStream()
          outStream.removeListener('stanza', onStanza)
          let onStream
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

  outStream.on('online', () => {
    debug('online')
    outStream.isAuthed = true
    if (outStream.queue) {
      outStream.queue.forEach((stanza) => {
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
  // According to the spec we cannot use the incoming streams

  if (!destDomain) {
    throw new Error('Trying to reach empty domain')
  // There's one already
  } else if (this.s2sOut.hasOwnProperty(destDomain)) {
    return this.s2sOut[destDomain]
  // Establish a new connection
  } else {
    return this.establishS2SStream(destDomain)
  }
}

/**
 * Called by router when verification is done
 */
DomainContext.prototype.addInStream = function (srcDomain, stream) {
  const self = this

  if (this.s2sIn.hasOwnProperty(srcDomain)) {
    // Replace old
    const oldStream = this.s2sIn[srcDomain]
    oldStream.error('conflict', 'Connection replaced')
    delete self.s2sIn[srcDomain]
  }

  // Check if we have the tls certificate
  if (this.credentials) {
    stream.credentials = this.credentials
    stream.opts.tls = true
  }

  this.setupStream(srcDomain, stream)
  stream.isConnected = true
  stream.isAuthed = true
  const closeCb = function () {
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
  const self = this

  stream.on('stanza', (stanza) => {
    // Before verified they can send whatever they want
    if (!stream.isAuthed) {
      return
    }

    if (stanza.name !== 'message' &&
      stanza.name !== 'presence' &&
      stanza.name !== 'iq') {
      // No normal stanza
      return
    }

    if (!(typeof stanza.attrs.from === 'string' &&
      typeof stanza.attrs.to === 'string')) {
      stream.error('improper-addressing')
      return
    }

    // Only accept 'from' attribute JIDs that have the same domain
    // that we validated the stream for
    const fromDomain = (new JID(stanza.attrs.from)).domain
    if (fromDomain !== domain) {
      stream.error('invalid-from')
      return
    }

    // Only accept 'to' attribute JIDs to this DomainContext
    const toDomain = (new JID(stanza.attrs.to)).domain
    if (toDomain !== self.domain) {
      stream.error('improper-addressing')
      return
    }

    self.receive(stanza)
  })
}

/*
 * We want to get our outgoing connection verified, sends <db:result/>
 */
DomainContext.prototype.startDialback = function (destDomain, outStream) {
  debug('start a dialback')
  outStream.dbKey = dialbackkey.generateHMAC(this.domain, destDomain, outStream.streamId)
  outStream.send(dialbackkey.dialbackKey(this.domain, destDomain, outStream.dbKey))

  const self = this
  var onResult = function (from, to, isValid) {
    if ((from !== destDomain) ||
      (to !== self.domain)) {
      // Not for us
      return
    }

    outStream.removeListener('dialbackResult', onResult)
    if (isValid) {
      outStream.emit('online')
    } else {
      // We cannot do anything else with this stream that
      // failed dialback
      outStream.end()
    }
  }
  outStream.on('dialbackResult', onResult)
}

/*
 * Incoming verification request for our outgoing connection that came
 * in via an inbound server connection
 */
DomainContext.prototype.verifyDialback = function (domain, id, key, cb) {
  const self = this
  let outStream
  if (this.s2sOut.hasOwnProperty(domain) &&
    (outStream = this.s2sOut[domain])) {
    if (outStream.isConnected) {
      debug('verify key:' + outStream.dbKey + ' ' + key)
      debug('compare id:' + outStream.streamId + ' ' + id)
      const isValid = outStream.streamId === id &&
        outStream.dbKey === key
      cb(isValid)
    } else {
      // Not online, wait for outStream.streamAttrs
      // (they may have our stream header & dialback key, but
      // our slow connection hasn't received their stream
      // header)
      outStream.on('online', () => {
        // Recurse
        self.verifyDialback(domain, id, key, cb)
      })
      outStream.on('close', () => {
        cb(false) // eslint-disable-line
      })
    }
  } else {
    cb(false) // eslint-disable-line
  }
}

DomainContext.prototype.verifyIncoming = function (fromDomain, inStream, dbKey) {
  const self = this
  debug('verify incoming streamid: ' + inStream.streamId)
  const outStream = this.sendRaw(dialbackkey.dialbackVerify(this.domain, fromDomain,
    inStream.streamId, dbKey),
  fromDomain)

  // These are needed before for removeListener()
  const onVerified = function (from, to, id, isValid) {
    from = nameprep(from)
    to = nameprep(to)
    if ((from !== fromDomain) ||
      (to !== self.domain) ||
      (id !== inStream.streamId)) {
      // Not for us
      return
    }
    // Tell them about it
    inStream.send(dialbackkey.dialbackResult(to, from, isValid))

    if (isValid) {
      // Finally validated them!
      self.addInStream(from, inStream)
    } else {
      // The connection isn't used for another domain, so
      // closing is safe
      inStream.send('</stream:stream>')
      inStream.end()
    }

    rmCbs()
  }
  const onClose = function () {
    // Outgoing connection didn't work out, tell the incoming
    // connection
    inStream.send(dialbackkey.dialbackResult(self.domain, fromDomain, false))

    rmCbs()
  }
  const onCloseIn = function () {
    // T'was the incoming stream that wanted to get
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
  const shutdown = function (conns) {
    for (const domain in conns) {
      if (conns.hasOwnProperty(domain)) {
        conns[domain].end()
      }
    }
  }
  shutdown(this.s2sOut)
  shutdown(this.s2sIn)
}

module.exports = DomainContext
