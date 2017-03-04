'use strict'

const WS = require('ws')
const WebSocket = global.WebSocket || WS
const EventEmitter = require('events')

class Socket extends EventEmitter {
  connect (url, fn) {
    const sock = this.socket = new WebSocket(url, ['xmpp'])

    const addListener = (sock.addEventListener || sock.on).bind(sock)
    const removeListener = (sock.removeEventListener || sock.removeListener).bind(sock)

    const openHandler = () => {
      if (fn) fn()
      this.emit('connect')
    }
    const messageHandler = ({data}) => this.emit('data', data)
    const errorHandler = (err) => {
      if (fn) fn(err)
      this.emit('error', err)
    }
    const closeHandler = () => {
      removeListener('open', openHandler)
      removeListener('message', messageHandler)
      removeListener('error', errorHandler)
      removeListener('close', closeHandler)
      this.emit('close')
    }

    addListener('open', openHandler)
    addListener('message', messageHandler)
    addListener('error', errorHandler)
    addListener('close', closeHandler)
  }

  close (fn) {
    this.once('close', fn)
    this.socket.close()
  }

  write (data, fn) {
    if (WebSocket === WS) {
      this.socket.send(data, fn)
    } else {
      this.socket.send(data)
      fn()
    }
  }
}

module.exports = Socket
