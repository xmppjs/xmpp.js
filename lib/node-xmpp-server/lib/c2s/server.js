'use strict';

var EventEmitter = require('events').EventEmitter
  , util = require('util')
  , crypto = require('crypto')
  , net = require('net')
  , fs = require('fs')
  , C2SStream = require('./stream')

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
function C2SServer(options) {
    this.options = {}
    if (options) this.options = options
    this.availableSaslMechanisms = []
    this.c2sPort = null

    // don't allow anybody by default when using client cert auth
    if ((this.options.requestCert) &&
        (this.options.rejectUnauthorized !== false)) {
        this.options.rejectUnauthorized = true
    }

    /* And now start listening to connections on the
     * port provided as an option.
     */
    this._setupAutoStart()

    // Load TLS key material
    this._setupTls()
}

util.inherits(C2SServer, EventEmitter)

C2SServer.prototype.C2SStream = C2SStream

C2SServer.prototype.C2S_PORT = 5222

C2SServer.prototype._setupTls = function() {
    if (!this.options.tls) return
    var details = this.options.tls
    details.key = details.key || fs.readFileSync(details.keyPath, 'ascii')
    details.cert = details.cert || fs.readFileSync(details.certPath, 'ascii')
    this.credentials = crypto.createCredentials(details)
}

C2SServer.prototype._setupAutoStart = function() {
    if (this.options.autostart === false) return
    var self = this
    var port = this.options.port || this.C2S_PORT
    var bindAddress = this.options.bindAddress || '::'
    this.c2sPort = net.createServer(function(inStream) {
        self.acceptConnection(inStream)
    }).listen(port, bindAddress)
}
/**
 * Called upon TCP connection from client.
 * If you want to use your own C2SStream class just overwrite server.C2SStream*/
C2SServer.prototype.acceptConnection = function(socket) {
    var stream = new this.C2SStream({
        rejectUnauthorized: this.options.rejectUnauthorized,
        requestCert: this.options.requestCert,
        socket: socket,
        server: this
    })
    this.emit('connect', stream)
    socket.addListener('error', function() {})
    stream.addListener('error', function() {})
}

C2SServer.prototype.registerSaslMechanism = function() {
    var args = arguments.length > 0 ? Array.prototype.slice.call(arguments) : []
    this.availableSaslMechanisms = this.availableSaslMechanisms.concat(args)
}

C2SServer.prototype.shutdown = function() {

    // we have to shutdown all connections
    this.emit('shutdown')

    // shutdown server
    this.c2sPort.close()
}

module.exports = C2SServer