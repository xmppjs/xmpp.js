'use strict'

const WS = require('ws')
const WebSocket = global.WebSocket || WS
const EventEmitter = require('events')

class Socket extends EventEmitter {
  constructor() {
    super()
    this.listeners = Object.create(null)
  }

  connect(url, fn) {
    this.url = url
    this._attachSocket(new WebSocket(url, ['xmpp']), fn)
  }

  _attachSocket(socket, fn) {
    const sock = (this.socket = socket)
    const {listeners} = this
    listeners.open = () => {
      this.emit('connect')
      if (fn) {
        fn()
      }
    }
    listeners.message = ({data}) => this.emit('data', data)
    listeners.error = err => {
      this.emit(
        'error',
        err instanceof Error ? err : new Error(`connection error ${this.url}`)
      )
    }
    listeners.close = ({code, reason}) => {
      this._detachSocket()
      this.emit('close', {code, reason})
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
