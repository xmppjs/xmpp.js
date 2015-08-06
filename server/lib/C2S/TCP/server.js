'use strict'

var debug = require('debug')('xmpp:server:C2S:TCP')
  , util = require('util')
  , crypto = require('crypto')
  , fs = require('fs')
  , net = require('net')
  , C2SServer = require('../server')
  , TCPStream = require('./stream')

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
function TCPServer(options) {
    C2SServer.call(this, options)

    // don't allow anybody by default when using client cert auth
    if ((this.options.requestCert) &&
        (this.options.rejectUnauthorized !== false)) {
        this.options.rejectUnauthorized = true
    }

    this._setupTls()

    var server = this.server = net.createServer(this.acceptConnection.bind(this))
    server.on('listening', this.emit.bind(this, 'listening'))
    server.on('error', this.emit.bind(this, 'error'))
    server.on('close', this.emit.bind(this, 'close'))

    if (this.options.autostart !== false) this.listen()
}

util.inherits(TCPServer, C2SServer)

TCPServer.prototype.TCPStream = TCPStream

TCPServer.prototype.TCP_PORT = 5222

TCPServer.prototype._setupTls = function() {
    if (!this.options.tls) return
    var details = this.options.tls
    details.key = details.key || fs.readFileSync(details.keyPath, 'ascii')
    details.cert = details.cert || fs.readFileSync(details.certPath, 'ascii')
    this.credentials = crypto.createCredentials(details)
}

TCPServer.prototype.listen = function (port, bindAddress, fn) {
    if (typeof port === 'function') {
        fn = port
        port = bindAddress = null
    } else if (typeof bindAddress === 'function') {
        fn = bindAddress
        bindAddress = null
    }
    if (fn) this.once('listening', fn)
    port = port || this.options.port || this.TCP_PORT
    bindAddress = bindAddress || this.options.bindAddress || '::'
    this.server.listen(port, bindAddress)
}

TCPServer.prototype.acceptConnection = function(socket) {
    debug('new connection')
    var stream = new this.TCPStream({
        rejectUnauthorized: this.options.rejectUnauthorized,
        requestCert: this.options.requestCert,
        socket: socket,
        server: this
    })
    this.emit('connection', stream)
}

module.exports = TCPServer
