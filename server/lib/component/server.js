'use strict';

var debug = require('debug')('xmpp:component:server')
  , util = require('util')
  , net = require('net')
  , C2SServer = require('../c2s/server')

/**
 * params:
 *   options : port on which to listen to component connections
 *   options.port : xmpp tcp socket port
 *   options.autostart : if we start listening at given port
 */

function ComponentServer(options) {
    this.options = {}
    if (options) this.options = options
    this.componentPort = null

    if (this.options.autostart !== false)
        this.listen()
        // TODO add reconnect-ability

}

util.inherits(ComponentServer, C2SServer)

ComponentServer.prototype.C2SStream = require('./stream')

ComponentServer.prototype.C2S_PORT = 5347


ComponentServer.prototype.listen = function (port, bindAddress, callback) {
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
    this.componentPort = net.createServer(function(inStream) {
        this.acceptConnection(inStream)
    }.bind(this)).listen(port, bindAddress, this.emit.bind(this, 'online'))
    debug(util.format('listen %s:%s', bindAddress, port))
    this._addConnectionListener()
}

ComponentServer.prototype._addConnectionListener = function (con) {
    con = con || this.componentPort
    con.on('close', this.emit.bind(this, 'close'))
    con.on('error', this.emit.bind(this, 'error'))
    con.on('end', this.emit.bind(this, 'end'))
}


ComponentServer.prototype.shutdown = function(callback) {
    debug('shutdown')
    // we have to shutdown all connections
    this.emit('shutdown')
    // shutdown server
    this.componentPort.close(callback)
}

module.exports = ComponentServer
