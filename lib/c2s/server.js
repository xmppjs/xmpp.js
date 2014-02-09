'use strict';

var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('xmpp:c2s:server')
  , util = require('util')
  , crypto = require('crypto')
  , net = require('net')
  , fs = require('fs')
  , C2SStream = require('./stream')
  , Plain = require('../authentication/plain')

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
    this.availableSaslMechanisms = [Plain]
    this.c2sPort = null

    // don't allow anybody by default when using client cert auth
    if ((this.options.requestCert) &&
        (this.options.rejectUnauthorized !== false)) {
        this.options.rejectUnauthorized = true
    }

    /* And now start listening to connections on the
     * port provided as an option.
     */
    if (this.options.autostart !== false)
        this.listen()
        // TODO add reconnect-ability

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

C2SServer.prototype.listen = function (port, bindAddress, callback) {
    if (typeof port === 'function') {
        callback = port
        port = bindAddress = null
    } else if (typeof bindAddress === 'function') {
        callback = bindAddress
        bindAddress = null
    }
    if (callback)
        this.once('online', callback)
    port = port || this.options.port || this.C2S_PORT
    bindAddress = bindAddress || this.options.bindAddress || '::'
    this.c2sPort = net.createServer(function(inStream) {
        this.acceptConnection(inStream)
    }.bind(this)).listen(port, bindAddress, this.emit.bind(this, 'online'))
    debug(util.format('listen %s:%s', bindAddress, port))
    this._addConnectionListener()
}

C2SServer.prototype._addConnectionListener = function (con) {
    con = con || this.c2sPort
    con.on('close', this.emit.bind(this, 'close'))
    con.on('error', this.emit.bind(this, 'error'))
    con.on('end', this.emit.bind(this, 'end'))
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
    debug('new connection')
    stream.on('error', function() {})
    this.emit('connect', stream)
    this.emit('connection', stream)
}

/**
 * returns all registered sasl mechanisms
 */
C2SServer.prototype.getSaslMechanisms = function() {
    return this.availableSaslMechanisms
}

/**
 * removes all registered sasl mechanisms
 */
C2SServer.prototype.clearSaslMechanism = function() {
    this.availableSaslMechanisms = []
}

/**
 * register a new sasl mechanism
 */
C2SServer.prototype.registerSaslMechanism = function(method) {
    // check if method is registered
    if (this.availableSaslMechanisms.indexOf(method) === -1 ) {
        this.availableSaslMechanisms.push(method)
    }
}

/**
 * unregister an existing sasl mechanism
 */
C2SServer.prototype.unregisterSaslMechanism = function(method) {
    // check if method is registered
    var index = this.availableSaslMechanisms.indexOf(method)
    if (index >= 0) {
        this.availableSaslMechanisms = this.availableSaslMechanisms.splice(index, 1)
    }
}

C2SServer.prototype.shutdown = function(callback) {
    debug('shutdown')
    // we have to shutdown all connections
    this.emit('shutdown')

    // shutdown server
    this.c2sPort.close(callback)
}

module.exports = C2SServer