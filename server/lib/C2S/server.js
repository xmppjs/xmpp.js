'use strict'

var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('xmpp:server:C2S:TCP')
  , util = require('util')
  , C2SStream = require('./stream')
  , Plain = require('./authentication/plain')

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
    EventEmitter.call(this)

    this.server = null

    this.options = {}
    if (options) this.options = options
    this.availableSaslMechanisms = [Plain]

    if (this.options.autostart !== false)
        this.listen()

    this.on('listening', this.emit.bind(this, 'online'))
    this.on('close', this.emit.bind(this, 'end'))
    this.on('connection', this.emit.bind(this, 'connect'))
}

util.inherits(C2SServer, EventEmitter)

C2SServer.prototype.C2SStream = C2SStream

C2SServer.prototype._addServerListeners = function () {
    this.server.on('close', this.emit.bind(this, 'close'))
    this.server.on('error', this.emit.bind(this, 'error'))
    this.server.on('end', this.emit.bind(this, 'end'))
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
        this.availableSaslMechanisms.splice(index, 1)
    }
}

C2SServer.prototype.shutdown = function(fn) {
    debug('shutdown')
    this.emit('shutdown')
    this.server.close(fn)
}

module.exports = C2SServer
