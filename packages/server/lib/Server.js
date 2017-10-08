'use strict'

const EventEmitter = require('events').EventEmitter
const util = require('util')

class Server extends EventEmitter {
  constructor(options) {
    super()

    this.options = options || {}
    this.port = this.options.port || this.DEFAULT_PORT

    this.sessions = new Set()

    this.on('connection', this.onConnection.bind(this))

    // Node-xmpp events
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

  onConnection(session) {
    this.sessions.add(session)
    session.connection.once('close', this.onConnectionClosed.bind(this, session))
  }

  onConnectionClosed(session) {
    this.sessions.delete(session)
    // FIXME should we remove all listeners?
  }

  acceptConnection(socket) {
    const session = new this.Session({
      rejectUnauthorized: this.options.rejectUnauthorized,
      requestCert: this.options.requestCert,
      socket,
      server: this,
      streamOpen: this.options.streamOpen,
      streamClose: this.options.streamClose,
      streamAttrs: this.options.streamAttrs,
    })
    socket.session = session
    this.emit('connection', session)
  }

  listen(port, host, fn) {
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

  close() {
    this.server.close.apply(this.server, arguments)
  }

  end(fn) {
    fn = fn || function () { }
    this.once('close', fn)
    this.close()
    this.endSessions()
    if (this.server && this.server.stop) this.server.stop()
  }

  // FIXME this should be async, data might not be drained
  endSessions() {
    const self = this
    this.sessions.forEach((session) => {
      session.removeListener('close', self.onConnectionClosed)
      session.end()
      self.connections.delete(session)
    })
  }
}

/*
 * Those are meant to be overriden
 */
Server.prototype.DEFAULT_PORT = null
Server.prototype.Session = null

Server.prototype.shutdown = Server.prototype.end

module.exports = Server
