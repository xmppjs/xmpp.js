'use strict'

var http = require('http'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    BOSHHttp = require('./http'),
    C2SStream = require('../c2s/stream'),
    Plain = require('../authentication/plain'),
    debug = require('debug')('xmpp:bosh:server')

/**
 * [BOSHServer description]
 *
 *   options.port : BOSH_PORT
 *   options.autostart : autostarts the server
 *
 * Some default ports are:
 * - http://example.com:5280/http-bind
 * - https://example.com:5281/http-bind
 */
function BOSHServer(options) {
    var self = this
    this.options = options || {}

    if (typeof options.autostart !== 'boolean') {
        options.autostart = true
    }

    EventEmitter.call(this)

    this.c2s = null
    this.availableSaslMechanisms = [Plain]

    this.bosh = new BOSHHttp(this.options)


    // listen for connect events from bosh
    this.bosh.on('connect', function (boshSession) {
        debug('bosh connect')

        // create new stream
        var stream = new C2SStream({
            socket: boshSession,
            server : self
        })

        // emit new stream
        self.emit('connect', stream)
    })

    this.bosh.on('close', this.emit.bind(this, 'close'))
    this.bosh.on('error', this.emit.bind(this, 'error'))
    this.bosh.on('end', this.emit.bind(this, 'end'))

    // start bosh server
    if (this.options.autostart) {
        this.listen()
    }
}

util.inherits(BOSHServer, EventEmitter)

BOSHServer.prototype.C2SStream = C2SStream
BOSHServer.prototype.BOSH_PORT = 5280

BOSHServer.prototype.listen = function() {
    debug('start Bosh Server')
    this.port = this.options.port || this.BOSH_PORT
    var self = this

    // start bosh http port
    http.createServer(function (req, res) {
        debug('handle bosh request')
        self.bosh.handleHTTP(req, res)
    }).listen(this.port, function(err) {
        if (err)
            return self.emit('error', err)

        self.emit('online')
    })
    debug('Bosh Server started at:' + this.port)
}

/**
 * returns all registered sasl mechanisms
 */
BOSHServer.prototype.getSaslMechanisms = function() {
    return this.availableSaslMechanisms
}

/**
 * removes all registered sasl mechanisms
 */
BOSHServer.prototype.clearSaslMechanism = function() {
    this.availableSaslMechanisms = []
}

/**
 * register a new sasl mechanism
 */
BOSHServer.prototype.registerSaslMechanism = function(method) {
    // check if method is registered
    if (this.availableSaslMechanisms.indexOf(method) === -1 ) {
        this.availableSaslMechanisms.push(method)
    }
}

/**
 * unregister an existing sasl mechanism
 */
BOSHServer.prototype.unregisterSaslMechanism = function(method) {
    // check if method is registered
    var index = this.availableSaslMechanisms.indexOf(method)
    if (index >= 0) {
        this.availableSaslMechanisms = this.availableSaslMechanisms.splice(index, 1)
    }
}

BOSHServer.prototype.shutdown = function (callback) {

    // we have to shutdown all connections
    this.emit('shutdown')

    // shutdown server
    // TODO not yet implemented
    //this.bosh.close()

    callback()
}

module.exports = BOSHServer
