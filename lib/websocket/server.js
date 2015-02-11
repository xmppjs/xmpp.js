'use strict';

var util = require('util')
  , WebSocketServer = require('ws').Server
  , WsSocket = require('./socket')
  , CS2Server = require('../c2s/server')
  , C2SStream = require('../c2s/stream')
  , debug = require('debug')('xmpp:server:websocket')

function WsServer(options) {
  options = options || {}

  // reset options autostart, because we do not want to open a tcp connection
  options.autostart = false

  CS2Server.call(this, options)
  var self = this

  this.wss = new WebSocketServer({
    port: options.port
  })

  this.wss.on('connection', function (socket) {
    debug('websocket connection')
    var wsSocket = new WsSocket()
    wsSocket.init(socket)
    self.acceptConnection(wsSocket)
  })
}

util.inherits(WsServer, CS2Server)

WsServer.prototype.C2SStream = C2SStream

WsServer.prototype.shutdown = function(callback) {
    debug('shutdown')
    // we have to shutdown all connections
    this.emit('shutdown')
    // shutdown server
    this.wss.close()
    if (callback) {
      callback()
    }
}

module.exports = WsServer
