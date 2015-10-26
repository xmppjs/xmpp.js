'use strict'

var util = require('util')
var crypto = require('crypto')
var net = require('net')
var fs = require('fs')
var C2SServer = require('../Server')

var TCP_PORT = 5222

/**
 * params:
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
function TCPServer (options) {
  var server = this.server = (options && options.server || net.createServer())
  server.on('connection', this.acceptConnection.bind(this))
  server.on('close', this.emit.bind(this, 'close'))
  server.on('error', this.emit.bind(this, 'error'))
  server.on('listening', this.emit.bind(this, 'listening'))

  C2SServer.call(this, options)
  this._setupTls()
}

util.inherits(TCPServer, C2SServer)

TCPServer.prototype.DEFAULT_PORT = TCP_PORT

TCPServer.prototype._setupTls = function () {
  if (!this.options.tls) return
  var details = this.options.tls
  details.key = details.key || fs.readFileSync(details.keyPath, 'ascii')
  details.cert = details.cert || fs.readFileSync(details.certPath, 'ascii')
  this.credentials = crypto.createCredentials(details)
}

module.exports = TCPServer
