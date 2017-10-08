'use strict'

const EventEmitter = require('events').EventEmitter
const util = require('util')
const ltx = require('node-xmpp-core').ltx
const hat = require('hat')
const debug = require('debug')('xmpp:bosh:session')

const NS_HTTPBIND = 'http://jabber.org/protocol/httpbind'

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
class BOSHSession extends EventEmitter {
  constructor(opts) {
    // Socket properties
    this.writable = true
    this.readable = true

    // BOSH settings
    this.nextRequestTimeout = opts.nextRequestTimeout
    if (opts.xmlns) {
      for (const prefix in opts.xmlns) {
        if (prefix) {
          this.xmlnsAttrs[`xmlns:${prefix}`] = opts.xmlns[prefix]
        } else {
          this.xmlnsAttrs.xmlns = opts.xmlns[prefix]
        }
      }
    }
    this.streamAttrs = opts.streamAttrs || {}
    this.handshakeAttrs = opts.bodyEl.attrs

    // Generate sid
    this.sid = opts.sid || hat()
    // Add sid to properties
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

  /**
   * Implementation of socket interface
   * forwards data from connection to http
   */
  write(data) {
    this.stanzaQueue.push(data)

    process.nextTick(this.workOutQueue.bind(this))
    // Indicates if we flush
    return this.outQueue.length > 0
  }

  serializeStanza(stanza, fn) {
    fn(stanza.toString()) // No specific serialization
  }

  pause() { }
  resume() { }

  end() {
    debug('close connection')
    this.closeSocket()
  }

  /**
   * Internal method to emit data to Connection
   */
  sendData(data) {
    // Emit this data to connection
    debug(`emit data: ${data.toString()}`)
    this.emit('data', data.toString())
  }

  closeSocket() {
    debug('close socket')
    this.resetNextRequestTimeout()
    this.emit('end')
    this.emit('close')
  }

  /**
   * Handle http requests
   */
  handleHTTP(opts) {
    debug('handle http')
    const oldOpts = this.inQueue[opts.bodyEl.attrs.rid]
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
    const self = this
    opts.timer = setTimeout(() => {
      delete opts.timer
      self.onReqTimeout(opts.bodyEl.attrs.rid)
    }, this.wait * 1000)

    // Process...
    this.inQueue[opts.bodyEl.attrs.rid] = opts
    process.nextTick(this.workInQueue.bind(this))
  }

  streamOpen(opts) {
    return [
      '<stream:stream',
      'xmlns="jabber:client"',
      'xmlns:stream="http://etherx.jabber.org/streams"',
      opts.xmppv ? (`xmpp:version="${opts.xmppv}"`) : '',
      `to="${opts.to}">`,
    ].join(' ')
  }

  workInQueue() {
    debug('run workInQueue')

    let opts = this.inQueue[this.nextRid]
    if (!opts) {
      // Still waiting for next rid request
      return
    }

    const self = this
    delete this.inQueue[this.nextRid]
    this.nextRid++

    // Handle message

    // extract values
    const rid = opts.bodyEl.attrs.rid
    const sid = opts.bodyEl.attrs.sid
    const to = opts.bodyEl.attrs.to
    const restart = opts.bodyEl.attrs['xmpp:restart']
    const xmppv = opts.bodyEl.attrs['xmpp:version']

    // Handle stream start
    if (!restart && rid && !sid) {
      debug('handle stream start')
      // Emulate stream creation for connection
      this.sendData(
        `<?xml version="1.0" ?>${this.streamOpen({ to, xmppv })}`
      )
      // Handle stream reset
    } else if (opts.bodyEl.attrs['xmpp:restart'] === 'true') {
      debug('reset stream')
      // Emulate stream restart for connection
      this.sendData(
        this.streamOpen({ to, xmppv })
      )
    }

    opts.bodyEl.children.forEach((stanza) => {
      debug(`send data: ${stanza}`)
      // Extract content
      self.sendData(stanza.toString())
    })

    // Input process, retain response for sending stanzas
    this.outQueue.push(opts)

    if (opts.bodyEl.attrs.type !== 'terminate') {
      debug('schedule response')
      process.nextTick(() => {
        self.workOutQueue()
        self.workInQueue()
      })
    } else {
      debug('terminate connection')
      for (let i = 0; i < this.outQueue.length; i++) {
        opts = this.outQueue[i]
        if (opts.timer) clearTimeout(opts.timer)
        this.respond(opts.res, { type: 'terminate' }, [])
      }
      this.outQueue = []
      this.closeSocket()
    }
  }

  workOutQueue() {
    debug('run workOutQueue')
    if ((this.stanzaQueue.length < 1) &&
      (this.outQueue.length > 0)) {
      this.emit('drain')
      return
    } else if (this.outQueue.length < 1) {
      return
    }

    // Queued stanzas
    const stanzas = this.stanzaQueue
    this.stanzaQueue = []

    // Available requests
    const opts = this.outQueue.shift()

    if (opts.timer) {
      clearTimeout(opts.timer)
      delete opts.timer
    }

    // WORKAROUND https://github.com/node-xmpp/node-xmpp-server/issues/100
    if (opts.res.connection.destroyed) {
      return
    }

    // Answer
    this.respond(opts.res, {}, stanzas)

    this.setNextRequestTimeout()
  }

  setNextRequestTimeout() {
    this.resetNextRequestTimeout()

    if (this.outQueue.length > 0) {
      return
    }

    const self = this
    this.NRTimeout = setTimeout(() => {
      self.emit('error', new Error('Session timeout'))
      self.emit('close')
    }, this.nextRequestTimeout)
  }

  resetNextRequestTimeout() {
    if (!this.NRTimeout) {
      return
    }

    clearTimeout(this.NRTimeout)
    delete this.NRTimeout
  }

  onReqTimeout(rid) {
    let opts = this.inQueue[rid]

    if (opts) {
      delete this.inQueue[rid]
    } else {
      let i = 0
      for (; i < this.outQueue.length; i++) {
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

  respond(res, attrs, children) {
    res.writeHead(
      200,
      { 'Content-Type': 'text/xml; charset=utf-8' }
    )
    for (const k in this.xmlnsAttrs) {
      attrs[k] = this.xmlnsAttrs[k]
    }
    if (res.boshAttrs) {
      for (const i in res.boshAttrs) {
        attrs[i] = res.boshAttrs[i]
      }
    }
    const bodyEl = new ltx.Element('body', attrs)
    if (children) {
      // TODO, we need to filter the stream element
      children.forEach((element) => {
        try {
          bodyEl.cnode(ltx.parse(element))
        } catch (err) {
          console.error(`could not parse${element}`)
        }
      })
    }
    bodyEl.write((s) => {
      res.write(s)
    })
    res.end()
  }
}

BOSHSession.prototype.name = 'BOSH'

BOSHSession.prototype.xmlnsAttrs = {
  xmlns: NS_HTTPBIND,
  'xmlns:xmpp': 'urn:xmpp:xbosh',
  'xmlns:stream': 'http://etherx.jabber.org/streams',
}

module.exports = BOSHSession
