'use strict'

require('es6-collections')
var EventEmitter = require('events').EventEmitter
var util = require('util')

function Server (options) {
  EventEmitter.call(this)

  this.options = options || {}
  this.port = this.options.port || this.DEFAULT_PORT

  this.connections = new Set()

  this.on('connection', this.onConnection.bind(this))

  // node-xmpp events
  this.on('listening', this.emit.bind(this, 'online'))
  this.on('close', this.emit.bind(this, 'offline'))
  this.on('close', this.emit.bind(this, 'shutdown'))

  /* And now start listening to connections on the
   * port provided as an option.
   */
  if (this.server && this.options.autostart !== false) {
    this.listen()
  }
}

util.inherits(Server, EventEmitter)

Server.prototype.onConnection = function (connection) {
  this.connections.add(connection)
  connection.once('close', this.onConnectionClosed.bind(this, connection))
  // backward compatibility FIXME remove me
  this.emit('connect', connection)
}

Server.prototype.onConnectionClosed = function (connection) {
  this.connections.delete(connection)
// FIXME should we remove all listeners?
}

Server.prototype.acceptConnection = function (socket) {
  var session = new this.Session({
    rejectUnauthorized: this.options.rejectUnauthorized,
    requestCert: this.options.requestCert,
    socket: socket,
    server: this,
    streamOpen: this.options.streamOpen,
    streamClose: this.options.streamClose,
    streamAttrs: this.options.streamAttrs
  })
  socket.session = session
  this.emit('connection', session)
}

/*
 * Those are meant to be overriden
 */
Server.prototype.DEFAULT_PORT = null
Server.prototype.Session = null

Server.prototype.listen = function (port, host, fn) {
  if (typeof port === 'function') {
    fn = port
    port = host = null
  } else if (typeof host === 'function') {
    fn = host
    host = null
  }

  port = port || this.port
  host = host || this.options.host || '::'

  this.server.listen(port, host, fn)
}

Server.prototype.close = function () {
  this.server.close.apply(this.server, arguments)
}

Server.prototype.end = function (fn) {
  fn = fn || function () {}
  this.once('close', fn)
  this.close()
  this.endSessions()
  if (this.server && this.server.stop) this.server.stop()
}

Server.prototype.shutdown = Server.prototype.end

// FIXME this should be async, data might not be drained
Server.prototype.endSessions = function () {
  var self = this
  this.connections.forEach(function (session) {
    session.removeListener('close', self.onConnectionClosed)
    session.end()
    self.connections.delete(session)
  })
}

module.exports = Server
