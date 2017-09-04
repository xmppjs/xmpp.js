'use strict'

const WS = require('ws')
const WebSocket = global.WebSocket || WS
const EventEmitter = require('events')

class Socket extends EventEmitter {
  connect(url, fn) {
    const sock = this.socket = new WebSocket(url, ['xmpp'])
    this.error = false

    const addListener = (sock.addEventListener || sock.on).bind(sock)
    const removeListener = (sock.removeEventListener || sock.removeListener).bind(sock)

    const openHandler = () => {
      this.emit('connect')
      if (fn) {
        fn()
      }
    }
    const messageHandler = ({data}) => this.emit('data', data)
    const errorHandler = () => {
      this.error = true
    }
    const closeHandler = evt => {
      removeListener('open', openHandler)
      removeListener('message', messageHandler)
      removeListener('error', errorHandler)
      removeListener('close', closeHandler)
      if (this.error) {
        this.emit('error', new Error(evt.reason || 'connection was closed abnormally'))
      }
      this.emit('close')
    }

    addListener('open', openHandler)
    addListener('message', messageHandler)
    addListener('error', errorHandler)
    addListener('close', closeHandler)
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
