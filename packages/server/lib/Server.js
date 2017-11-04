'use strict'

const { EventEmitter, promise } = require('@xmpp/events')
const middleware = require('@xmpp/middleware')
const router = require('@xmpp/router')
const { rack } = require('hat')

class Server extends EventEmitter {
  constructor(options) {
    super()

    this.options = options || {}
    this.port = this.options.port || this.DEFAULT_PORT

    this.connections = new Set()

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

  onConnection(connection) {
    this.connections.add(connection)
    connection.once('close', this.onConnectionClosed.bind(this, connection))
  }

  onConnectionClosed(connection) {
    this.connections.delete(connection)
    // FIXME: should we remove all listeners?
  }

  acceptConnection(socket) {
    const connection = new this.Connection({})
    socket.connection = connection
    connection.server = this
    connection.authenticated = false
    connection.generateId = rack(this.options.idBits, this.options.idBitsBase, this.options.idBitsExpandBy)
    connection.id = connection.generateId()
    connection.mw = middleware(connection)
    connection.router = router(connection.mw)
    Object.keys(this.plugins).forEach(name => {
      const plugin = this.plugins[name]
      // Ignore browserify stubs
      if (!plugin.plugin) {
        return
      }
      connection.plugin(plugin)
    })
    this.emit('connection', connection)
    connection.open({ socket })
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

    return promise(this.server, 'listening')
  }

  close(...args) {
    this.server.close(...args)
  }

  end(fn = () => { }) {
    this.once('close', fn)
    this.close()
    this.endConnections()
    if (this.server && this.server.stop) this.server.stop()
  }

  // FIXME: this should be async, data might not be drained
  endConnections() {
    const self = this
    this.connections.forEach((connection) => {
      connection.removeListener('close', self.onConnectionClosed)
      connection.end()
      self.connections.delete(connection)
    })
  }
}

/*
 * Those are meant to be overriden
 */
Server.prototype.DEFAULT_PORT = null
Server.prototype.Connection = null
Server.prototype.plugins = null

Server.prototype.shutdown = Server.prototype.end

module.exports = Server
