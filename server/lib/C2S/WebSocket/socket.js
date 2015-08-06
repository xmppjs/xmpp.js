'use strict'

var EventEmitter = require('events').EventEmitter
  , util = require('util')
  , debug = require('debug')('xmpp:server:websocket')
  , ltx = require('../../xmpp').core.ltx

function WsSocket() {
  EventEmitter.call(this)

  this.xmlns = {}
  this.websocket = null

  this.writable = true
  this.readable = true

}
util.inherits(WsSocket, EventEmitter)

WsSocket.prototype.maxStanzaSize = 65535

WsSocket.prototype.init = function (ws) {
  debug('set socket')
  this.websocket = ws
  var self = this

  ws.on('open', function () {
    debug('websocket connected')
  })

  ws.on('close', function () {
    debug('websocket disconnected')
    self.emit('close')
  })

  ws.on('message', function(message, flags) {
    var connection = self.connection

    var body = null
    if (flags && (flags.binary || flags.masked)) {
      body = message.toString('utf8')
    } else {
      body = message
    }

    var stanza
    try {
        stanza = ltx.parse(body)
    }
    catch (e) {
        connection.error('xml-not-well-formed', 'XML parse error')
        return
    }

    if (stanza.is('open'))
        connection.emit('streamStart', stanza.attrs)
    else
        connection.emit('stanza', stanza)
  })

  ws.on('error', function () {
    debug('websocket error')
    self.emit('error')
  })

  self.emit('connect')
}

WsSocket.prototype.serializeStanza = function(stanza, fn) {
  fn(stanza.toString()) // No specific serialization
}

WsSocket.prototype.write = function (data) {
  debug(data)
  var self = this
  this.websocket.send(data,
    function (error) {
      if (error) {
        self.emit('error', error)
      }
    })
}

WsSocket.prototype.pause = function () {
  // nothing to do
  debug('websocket is requested to pause. But we cannot do anything')
}

WsSocket.prototype.resume = function () {
  // nothing to do
  debug('websocket is requested to resume. But we cannot do anything')
}

WsSocket.prototype.end = function () {
  debug('close connection')
  this.emit('end')
}

module.exports = WsSocket
