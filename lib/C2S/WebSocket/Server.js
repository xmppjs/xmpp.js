'use strict'

var util = require('util')
  , http = require('http')
  , ws = require('ws')
  , Socket = require('./Socket')
  , C2SServer = require('../Server')

var WEBSOCKET_PORT = 5290

function WebSocketServer(options) {
    var server = this.server = (options && options.server || http.createServer())
    server.on('close', this.emit.bind(this, 'close'))
    server.on('error', this.emit.bind(this, 'error'))
    server.on('listening', this.emit.bind(this, 'listening'))

    var WS = this.WS = new ws.Server({server: server})
    var self = this
    WS.on('connection', function(socket) {
        self.acceptConnection(new Socket(socket))
    })

    C2SServer.call(this, options)
}

util.inherits(WebSocketServer, C2SServer)

WebSocketServer.prototype.DEFAULT_PORT = WEBSOCKET_PORT

module.exports = WebSocketServer
