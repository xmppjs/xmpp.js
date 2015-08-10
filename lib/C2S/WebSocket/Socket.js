'use strict'

var EventEmitter = require('events').EventEmitter
  , util = require('util')
  , debug = require('debug')('xmpp:server:websocket')

function Socket(socket) {
    EventEmitter.call(this)

    this.xmlns = {}
    this.websocket = null

    this.writable = true
    this.readable = true
    this.setupSocket(socket)
}
util.inherits(Socket, EventEmitter)

Socket.prototype.maxStanzaSize = 65535

Socket.prototype.setupSocket = function(socket) {
    debug('set socket')
    this.socket = socket
    var self = this

    socket.on('open', function () {
        debug('websocket connected')
    })

    socket.on('close', function () {
        debug('websocket disconnected')
        self.emit('close')
    })

    socket.on('message', function (body, flags) {
        var content = null

        if (flags && (flags.binary || flags.masked)) {
            content = body.toString('utf8')
        } else {
            content = body
        }

        if (content.match(/<stream:stream .*\/>/)) {
            content = content.replace('/>', '>')
        }

        debug(body)

        self.emit('data', content)
    })

    socket.on('error', function () {
        debug('websocket error')
        self.emit('error')
    })
}

Socket.prototype.serializeStanza = function(stanza, fn) {
    fn(stanza.toString()) // No specific serialization
}

Socket.prototype.write = function (data) {
    debug(data)
    var self = this
    this.socket.send(data, function(error) {
        if (error) {
            self.emit('error', error)
        }
    })
}

Socket.prototype.pause = function () {
    // nothing to do
    debug('websocket is requested to pause. But we cannot do anything')
}

Socket.prototype.resume = function () {
    // nothing to do
    debug('websocket is requested to resume. But we cannot do anything')
}

Socket.prototype.end = function () {
    debug('close connection')
    this.socket.close()
    this.emit('end')
}

module.exports = Socket
