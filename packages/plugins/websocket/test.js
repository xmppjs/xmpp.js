'use strict'

const test = require('ava')
const ConnectionWebSocket = require('./lib/Connection')
const Socket = require('./lib/Socket')
const EventEmitter = require('events')

test('socketParameters()', t => {
  let params

  params = ConnectionWebSocket.prototype.socketParameters('ws://foo')
  t.is(params, 'ws://foo')

  params = ConnectionWebSocket.prototype.socketParameters('wss://foo')
  t.is(params, 'wss://foo')

  params = ConnectionWebSocket.prototype.socketParameters('http://foo')
  t.is(params, undefined)
})

test.cb('browser websocket error', t => {
  const socket = new Socket()
  const sock = new EventEmitter()
  sock.addEventListener = sock.addListener
  socket._attachSocket(sock)
  socket.url = 'ws://foobar'
  socket.on('error', err => {
    t.is(err.message, 'connection error ws://foobar')
    t.end()
  })
  socket.socket.emit('error', {})
})
