'use strict'

var http = require('http'),
    util = require('util'),
    C2SServer = require('../server'),
    C2SStream = require('../stream'),
    BOSHHttp = require('./http'),
    BOSHStream = require('./session'),
    debug = require('debug')('xmpp:server:C2S:BOSH')

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
    C2SServer.call(this, options)

    var server = this.server = new BOSHHttp(this.options)
    server.on('error', this.emit.bind(this, 'error'))
    server.on('close', this.emit.bind(this, 'close'))
    server.on('connection', this.acceptConnection.bind(this))

    if (this.options.autostart !== false) this.listen()
}

util.inherits(BOSHServer, C2SServer)

BOSHServer.prototype.BOSHStream = BOSHStream
BOSHServer.prototype.BOSH_PORT = 5280

BOSHServer.prototype.listen = function(port, bindAddress, fn) {
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

    var self = this
    this.http = http.createServer(function (req, res) {
        debug('handle bosh request')
        self.server.handleHTTP(req, res)
    }).listen(port, bindAddress, function(err) {
        if (err)
            return self.emit('error', err)

        self.emit('listening')
    })
}

BOSHServer.prototype.acceptConnection = function(socket) {
    debug('new connection')
    var stream = new C2SStream({
        socket: socket,
        server: this
    })
    this.emit('connection', stream)
}


module.exports = BOSHServer
