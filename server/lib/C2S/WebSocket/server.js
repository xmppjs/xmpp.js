'use strict'

var util = require('util')
  , ws = require('ws')
  , WebSocketStream = require('./socket')
  , C2SServer = require('../server')
  , debug = require('debug')('xmpp:server:C2S:WebSocket')

function WebSocketServer(options) {
  C2SServer.call(this, options)

  if (this.options.autostart !== false) this.listen()
}

util.inherits(WebSocketServer, C2SServer)

WebSocketServer.prototype.WebSocketStream = WebSocketStream

WebSocketServer.prototype.WEBSOCKET_PORT = 5285

WebSocketServer.prototype.listen = function(port, bindAddress, fn) {
  if (typeof port === 'function') {
      fn = port
      port = bindAddress = null
  } else if (typeof bindAddress === 'function') {
      fn = bindAddress
      bindAddress = null
  }
  if (fn) this.once('listening', fn)
  port = port || this.options.port || this.WEBSOCKET_PORT
  bindAddress = bindAddress || this.options.bindAddress || '::'
  var server = this.server = new ws.Server({
    port: port,
    host: bindAddress
  })

  var self = this
  server.on('listening', this.emit.bind(this, 'listening'))
  server.on('error', this.emit.bind(this, 'error'))
  server.on('close', this.emit.bind(this, 'close'))
  server.on('connection', function(socket) {
    var stream = new WebSocketStream()
    stream.init(socket)
    self.acceptConnection(stream)
  })
}

WebSocketServer.prototype.acceptConnection = function(socket) {
  debug('new connection')
  var self = this
  var stream = new this.C2SStream({
    server: self,
    socket: socket
  })
  this.emit('connection', stream)
}

module.exports = WebSocketServer
