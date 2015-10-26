'use strict'

var util = require('util')
var http = require('http')
var ws = require('ws')
var Socket = require('./Socket')
var C2SServer = require('../Server')
var serverStop = require('../../serverStop')

var WEBSOCKET_PORT = 5290
var XMPP_FRAMING = 'urn:ietf:params:xml:ns:xmpp-framing'

function WebSocketServer (opts) {
  var options = opts || {}
  var server = this.server = serverStop(options.server || http.createServer())
  server.on('close', this.emit.bind(this, 'close'))
  server.on('error', this.emit.bind(this, 'error'))
  server.on('listening', this.emit.bind(this, 'listening'))

  var WS = this.WS = new ws.Server({server: server})
  var self = this
  WS.on('connection', function (socket) {
    self.acceptConnection(new Socket(socket))
  })

  options.streamOpen = 'open'
  options.streamClose = 'close'
  options.streamAttrs = {'xmlns': XMPP_FRAMING}

  C2SServer.call(this, options)
}

util.inherits(WebSocketServer, C2SServer)

WebSocketServer.prototype.DEFAULT_PORT = WEBSOCKET_PORT

module.exports = WebSocketServer
