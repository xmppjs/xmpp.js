'use strict'

var util = require('util')
  , Server = require('./BOSHServer')
  , http = require('http')
  , C2SServer = require('../Server')

var BOSH_PORT = 5280

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
    var server = this.server = (options && options.server || http.createServer())
    server.on('close', this.emit.bind(this, 'close'))
    server.on('error', this.emit.bind(this, 'error'))
    server.on('listening', this.emit.bind(this, 'listening'))

    var BOSH = this.BOSH = new Server({server: server})
    BOSH.on('connection', this.acceptConnection.bind(this))

    C2SServer.call(this, options)
}

util.inherits(BOSHServer, C2SServer)

BOSHServer.prototype.DEFAULT_PORT = BOSH_PORT

module.exports = BOSHServer
