'use strict'

const util = require('util')
const Server = require('./BOSHServer')
const C2SServer = require('../Server')

const BOSH_PORT = 5280

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
class BOSHServer extends C2SServer {
  constructor(opts) {
    const options = opts || {}
    const server = this.server = new Server({
      server: options.server,
      cors: options.cors,
      nextRequestTimeout: options.nextRequestTimeout,
    })
    server.on('close', this.emit.bind(this, 'close'))
    server.on('error', this.emit.bind(this, 'error'))
    server.on('listening', this.emit.bind(this, 'listening'))
    server.on('connection', this.acceptConnection.bind(this))

    super(options)
  }
}

BOSHServer.prototype.DEFAULT_PORT = BOSH_PORT

module.exports = BOSHServer
