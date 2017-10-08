'use strict'

const util = require('util')
const http = require('http')
const ws = require('ws')
const Socket = require('./Socket')
const C2SServer = require('../Server')
const serverStop = require('../../serverStop')

const WEBSOCKET_PORT = 5290
const XMPP_FRAMING = 'urn:ietf:params:xml:ns:xmpp-framing'

function WebSocketServer (opts) {
  const options = opts || {}
  const server = this.server = serverStop(options.server || http.createServer())
  server.on('close', this.emit.bind(this, 'close'))
  server.on('error', this.emit.bind(this, 'error'))
  server.on('listening', this.emit.bind(this, 'listening'))

  const WS = this.WS = new ws.Server({server})
  const self = this
  WS.on('connection', (socket) => {
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
