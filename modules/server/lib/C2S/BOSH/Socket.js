'use strict'

var EventEmitter = require('events').EventEmitter
var util = require('util')
var ltx = require('node-xmpp-core').ltx
var hat = require('hat')
var debug = require('debug')('xmpp:bosh:session')

var NS_HTTPBIND = 'http://jabber.org/protocol/httpbind'

/**
 * Gets constructed with a first HTTP request (opts.req & opts.res),
 * but receives more in method handleHTTP().
 *
 * The BOSH server session behaves like a normal socket and emits all proper
 * messages to a connection
 *
 * Implement the follwing methods
 * serializeStanza()
 * write()
 * pause()
 * resume()
 * end()
 *
 * Implement the following events:
 * this.emit('connect')
 * this.emit('data', string)
 * this.emit('end')
 * this.emit('close')
 *
 * License: MIT
 */
function BOSHSession (opts) {
  // socket properties
  this.writable = true
  this.readable = true

  // BOSH settings
  this.nextRequestTimeout = opts.nextRequestTimeout
  if (opts.xmlns) {
    for (var prefix in opts.xmlns) {
      if (prefix) {
        this.xmlnsAttrs['xmlns:' + prefix] = opts.xmlns[prefix]
      } else {
        this.xmlnsAttrs.xmlns = opts.xmlns[prefix]
      }
    }
  }
  this.streamAttrs = opts.streamAttrs || {}
  this.handshakeAttrs = opts.bodyEl.attrs

  // generate sid
  this.sid = opts.sid || hat()
  // add sid to properties
  this.xmlnsAttrs.sid = this.sid

  this.nextRid = parseInt(opts.bodyEl.attrs.rid, 10)
  this.wait = parseInt(opts.bodyEl.attrs.wait || '30', 10)
  this.hold = parseInt(opts.bodyEl.attrs.hold || '1', 10)
  this.inQueue = Object.create(null)
  this.outQueue = []
  this.stanzaQueue = []

  this.emit('connect')

  this.inQueue[opts.bodyEl.attrs.rid] = opts
  process.nextTick(this.workInQueue.bind(this))
  this.setNextRequestTimeout()
}

util.inherits(BOSHSession, EventEmitter)

BOSHSession.prototype.name = 'BOSH'

BOSHSession.prototype.xmlnsAttrs = {
  xmlns: NS_HTTPBIND,
  'xmlns:xmpp': 'urn:xmpp:xbosh',
  'xmlns:stream': 'http://etherx.jabber.org/streams'
}

/**
 * implementation of socket interface
 * forwards data from connection to http
 */
BOSHSession.prototype.write = function (data) {
  this.stanzaQueue.push(data)

  process.nextTick(this.workOutQueue.bind(this))
  // indicates if we flush
  return this.outQueue.length > 0
}

BOSHSession.prototype.serializeStanza = function (stanza, fn) {
  fn(stanza.toString()) // No specific serialization
}

BOSHSession.prototype.pause = function () {}

BOSHSession.prototype.resume = function () {}

BOSHSession.prototype.end = function () {
  debug('close connection')
  this.closeSocket()
}

/**
 * internal method to emit data to Connection
 */
BOSHSession.prototype.sendData = function (data) {
  // emit this data to connection
  debug('emit data: ' + data.toString())
  this.emit('data', data.toString())
}

BOSHSession.prototype.closeSocket = function () {
  debug('close socket')
  this.resetNextRequestTimeout()
  this.emit('end')
  this.emit('close')
}

/**
 * handle http requests
 */
BOSHSession.prototype.handleHTTP = function (opts) {
  debug('handle http')
  var oldOpts = this.inQueue[opts.bodyEl.attrs.rid]
  if (oldOpts) {
    // Already queued? Replace with this request
    oldOpts.res.writeHead(
      403,
      { 'Content-Type': 'text/plain' }
    )
    oldOpts.res.end('Request replaced by same RID')
  } else if (parseInt(opts.bodyEl.attrs.rid, 10) < parseInt(this.nextRid, 10)) {
    // This req has already been processed.
    this.outQueue.push(opts)
    return
  }

  this.resetNextRequestTimeout()

  // Set up timeout:
  var self = this
  opts.timer = setTimeout(function () {
    delete opts.timer
    self.onReqTimeout(opts.bodyEl.attrs.rid)
  }, this.wait * 1000)

  // Process...
  this.inQueue[opts.bodyEl.attrs.rid] = opts
  process.nextTick(this.workInQueue.bind(this))
}

BOSHSession.prototype.streamOpen = function (opts) {
  /* eslint-disable indent */
  return [
    '<stream:stream ',
    'xmlns="jabber:client" ',
    'xmlns:stream="http://etherx.jabber.org/streams" ',
    'to="' + opts.to + '"',
    opts.xmppv ? (' xmpp:version="' + opts.xmppv + '"') : '',
    '>'
  ].join('')
/* eslint-enable indent */
}

BOSHSession.prototype.workInQueue = function () {
  debug('run workInQueue')

  var opts = this.inQueue[this.nextRid]
  if (!opts) {
    // Still waiting for next rid request
    return
  }

  var self = this
  delete this.inQueue[this.nextRid]
  this.nextRid++

  // handle message

  // extract values
  var rid = opts.bodyEl.attrs.rid
  var sid = opts.bodyEl.attrs.sid
  var to = opts.bodyEl.attrs.to
  var restart = opts.bodyEl.attrs['xmpp:restart']
  var xmppv = opts.bodyEl.attrs['xmpp:version']

  // handle stream start
  if (!restart && rid && !sid) {
    debug('handle stream start')
    // emulate stream creation for connection
    this.sendData(
      '<?xml version="1.0" ?>' +
      this.streamOpen({to: to, xmppv: xmppv})
    )
  // handle stream reset
  } else if (opts.bodyEl.attrs['xmpp:restart'] === 'true') {
    debug('reset stream')
    // emulate stream restart for connection
    this.sendData(
      this.streamOpen({to: to, xmppv: xmppv})
    )
  }

  opts.bodyEl.children.forEach(function (stanza) {
    debug('send data: ' + stanza)
    // extract content
    self.sendData(stanza.toString())
  })

  // Input process, retain response for sending stanzas
  this.outQueue.push(opts)

  if (opts.bodyEl.attrs.type !== 'terminate') {
    debug('schedule response')
    process.nextTick(function () {
      self.workOutQueue()
      self.workInQueue()
    })
  } else {
    debug('terminate connection')
    for (var i = 0; i < this.outQueue.length; i++) {
      opts = this.outQueue[i]
      if (opts.timer) clearTimeout(opts.timer)
      this.respond(opts.res, { type: 'terminate' }, [])
    }
    this.outQueue = []
    this.closeSocket()
  }
}

BOSHSession.prototype.workOutQueue = function () {
  debug('run workOutQueue')
  if ((this.stanzaQueue.length < 1) &&
    (this.outQueue.length > 0)) {
    this.emit('drain')
    return
  } else if (this.outQueue.length < 1) {
    return
  }

  // queued stanzas
  var stanzas = this.stanzaQueue
  this.stanzaQueue = []

  // available requests
  var opts = this.outQueue.shift()

  if (opts.timer) {
    clearTimeout(opts.timer)
    delete opts.timer
  }

  // WORKAROUND https://github.com/node-xmpp/node-xmpp-server/issues/100
  if (opts.res.connection.destroyed) {
    return
  }

  // answer
  this.respond(opts.res, {}, stanzas)

  this.setNextRequestTimeout()
}

BOSHSession.prototype.setNextRequestTimeout = function () {
  this.resetNextRequestTimeout()

  if (this.outQueue.length > 0) {
    return
  }

  var self = this
  this.NRTimeout = setTimeout(function () {
    self.emit('error', new Error('Session timeout'))
    self.emit('close')
  }, this.nextRequestTimeout)
}

BOSHSession.prototype.resetNextRequestTimeout = function () {
  if (!this.NRTimeout) {
    return
  }

  clearTimeout(this.NRTimeout)
  delete this.NRTimeout
}

BOSHSession.prototype.onReqTimeout = function (rid) {
  var opts = this.inQueue[rid]

  if (opts) {
    delete this.inQueue[rid]
  } else {
    for (var i = 0; i < this.outQueue.length; i++) {
      if (this.outQueue[i].bodyEl.attrs.rid === rid) break
    }

    if (i < this.outQueue.length) {
      opts = this.outQueue[i]
      this.outQueue.splice(i, 1)
    } else {
      console.warn('Spurious timeout for BOSH rid', rid)
      return
    }
  }
  this.respond(opts.res, {})
}

BOSHSession.prototype.respond = function (res, attrs, children) {
  res.writeHead(
    200,
    { 'Content-Type': 'text/xml; charset=utf-8' }
  )
  for (var k in this.xmlnsAttrs) {
    attrs[k] = this.xmlnsAttrs[k]
  }
  if (res.boshAttrs) {
    for (var i in res.boshAttrs) {
      attrs[i] = res.boshAttrs[i]
    }
  }
  var bodyEl = new ltx.Element('body', attrs)
  if (children) {
    // TODO, we need to filter the stream element
    children.forEach(function (element) {
      try {
        bodyEl.cnode(ltx.parse(element))
      } catch (err) {
        console.error('could not parse' + element)
      }
    })
  }
  bodyEl.write(function (s) {
    res.write(s)
  })
  res.end()
}

module.exports = BOSHSession
