'use strict'

const EventEmitter = require('events').EventEmitter
const util = require('util')
const debug = require('debug')('xmpp:server:websocket')
const ltx = require('node-xmpp-core').ltx

class Socket extends EventEmitter {
  constructor(socket) {
    super()

    this.xmlns = {}
    this.websocket = null

    this.writable = true
    this.readable = true
    this.setupSocket(socket)
  }

  setupSocket(socket) {
    debug('set socket')
    this.socket = socket
    const self = this

    socket.on('open', () => {
      debug('websocket connected')
    })

    socket.on('close', () => {
      debug('websocket disconnected')
      self.emit('close')
    })

    socket.on('message', (message, flags) => {
      const connection = self.session.connection
      let body

      if (flags && (flags.binary || flags.masked)) {
        body = message.toString('utf8')
      } else {
        body = message
      }

      let stanza
      try {
        stanza = ltx.parse(body)
      } catch (e) {
        console.log(e)
        connection.error('xml-not-well-formed', 'XML parse error')
        return
      }

      if (stanza.is('open')) {
        connection.emit('streamStart', stanza.attrs)
      } else {
        connection.emit('stanza', stanza)
      }
    })

    socket.on('error', () => {
      debug('websocket error')
      self.emit('error')
    })
  }

  serializeStanza(stanza, fn) {
    fn(stanza.toString()) // No specific serialization
  }

  write(data) {
    debug(data)
    const self = this
    this.socket.send(data, (error) => {
      if (error) {
        self.emit('error', error)
      }
    })
  }

  pause() {
    // Nothing to do
    debug('websocket is requested to pause. But we cannot do anything')
  }

  resume() {
    // Nothing to do
    debug('websocket is requested to resume. But we cannot do anything')
  }

  end() {
    debug('close connection')
    this.socket.close()
    this.emit('end')
  }
}

Socket.prototype.maxStanzaSize = 65535

module.exports = Socket
