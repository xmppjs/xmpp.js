'use strict'

const EventEmitter = require('events').EventEmitter
const util = require('util')
const debug = require('debug')('xmpp:server:websocket')
const ltx = require('node-xmpp-core').ltx

function Socket (socket) {
  EventEmitter.call(this)

  this.xmlns = {}
  this.websocket = null

  this.writable = true
  this.readable = true
  this.setupSocket(socket)
}
util.inherits(Socket, EventEmitter)

Socket.prototype.maxStanzaSize = 65535

Socket.prototype.setupSocket = function (socket) {
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

Socket.prototype.serializeStanza = function (stanza, fn) {
  fn(stanza.toString()) // No specific serialization
}

Socket.prototype.write = function (data) {
  debug(data)
  const self = this
  this.socket.send(data, (error) => {
    if (error) {
      self.emit('error', error)
    }
  })
}

Socket.prototype.pause = function () {
  // Nothing to do
  debug('websocket is requested to pause. But we cannot do anything')
}

Socket.prototype.resume = function () {
  // Nothing to do
  debug('websocket is requested to resume. But we cannot do anything')
}

Socket.prototype.end = function () {
  debug('close connection')
  this.socket.close()
  this.emit('end')
}

module.exports = Socket
