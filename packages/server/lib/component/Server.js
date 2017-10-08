'use strict'

const net = require('net')
const Server = require('../Server')
const Session = require('./Session')

const COMPONENT_PORT = 5347

/**
 * Params:
 *   options : port on which to listen to component connections
 *   options.port : xmpp tcp socket port
 *   options.autostart : if we start listening at given port
 */
class ComponentServer extends Server {
  constructor(options) {
    super(options)

    const server = this.server = ((options && options.server) || net.createServer())
    server.on('connection', this.acceptConnection.bind(this))
    server.on('close', this.emit.bind(this, 'close'))
    server.on('error', this.emit.bind(this, 'error'))
    server.on('listening', this.emit.bind(this, 'listening'))
  }
}

ComponentServer.prototype.Session = Session

ComponentServer.prototype.DEFAULT_PORT = COMPONENT_PORT

module.exports = ComponentServer
