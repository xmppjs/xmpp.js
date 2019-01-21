'use strict'

const WS = require('ws')
const WebSocket = global.WebSocket || WS
const EventEmitter = require('events')

const CODE = 'ECONNERROR'

class Socket extends EventEmitter {
  constructor() {
    super()
    this.listeners = Object.create(null)
  }

  connect(url) {
    this.url = url
    this._attachSocket(new WebSocket(url, ['xmpp']))
  }

  _attachSocket(socket) {
    const sock = (this.socket = socket)
    const {listeners} = this
    listeners.open = () => {
      this.emit('connect')
    }

    listeners.message = ({data}) => this.emit('data', data)
    listeners.error = event => {
      // WS
      let {error} = event
      // DOM
      if (!error) {
        error = new Error(`WebSocket ${CODE} ${this.url}`)
        error.errno = CODE
        error.code = CODE
      }

      error.event = event
      error.url = this.url
      this.emit('error', error)
    }

    listeners.close = event => {
      this._detachSocket()
      this.emit('close', !event.wasClean, event)
    }

    sock.addEventListener('open', listeners.open)
    sock.addEventListener('message', listeners.message)
    sock.addEventListener('error', listeners.error)
    sock.addEventListener('close', listeners.close)
  }

  _detachSocket() {
    delete this.url
    const {socket, listeners} = this
    Object.getOwnPropertyNames(listeners).forEach(k => {
      socket.removeEventListener(k, listeners[k])
      delete listeners[k]
    })
    delete this.socket
  }

  end() {
    this.socket.close()
  }

  write(data, fn) {
    if (WebSocket === WS) {
      this.socket.send(data, fn)
    } else {
      this.socket.send(data)
      fn()
    }
  }
}

module.exports = Socket
