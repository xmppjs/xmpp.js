'use strict'

const util = require('util')
const tls = require('tls')
const net = require('net')
const fs = require('fs')
const C2SServer = require('../Server')
const serverStop = require('../../serverStop')

const TCP_PORT = 5222

/**
 * Params:
 *   options : port on which to listen to C2S connections
 *   options.port : xmpp tcp socket port
 *   options.domain : domain of xmpp server
 *   options.autostart : if we start listening at given port
 *   options.requestCert : expect a client certificate (see tls.createSecurePair for more)
 *   options.rejectUnauthorized : reject when client cert missmatches (see tls.createSecurePair for more)
 *   options.tls : wrapper object for tlc config
 *   options.tls.key : private key string
 *   options.tls.cert : certificate string
 *   options.tls.keyPath : path to key
 *   options.tls.certPath : path to certificate
 */
class TCPServer extends C2SServer {
  constructor(options) {
    const server = this.server = serverStop((options && options.server) || net.createServer())
    server.on('connection', this.acceptConnection.bind(this))
    server.on('close', this.emit.bind(this, 'close'))
    server.on('error', this.emit.bind(this, 'error'))
    server.on('listening', this.emit.bind(this, 'listening'))

    super(options)
    this._setupTls()
  }

  _setupTls() {
    if (!this.options.tls) return
    const details = this.options.tls
    details.key = details.key || fs.readFileSync(details.keyPath, 'ascii')
    details.cert = details.cert || fs.readFileSync(details.certPath, 'ascii')
    this.credentials = tls.createSecureContext(details)
  }
}

TCPServer.prototype.DEFAULT_PORT = TCP_PORT

module.exports = TCPServer
