'use strict'

const test = require('ava')
const ConnectionWebSocket = require('../lib/Connection')
const Socket = require('../lib/Socket')
const EventEmitter = require('events')
const xml = require('@xmpp/xml')

test('send() adds jabber:client xmlns', t => {
  const connection = new ConnectionWebSocket()
  const element = xml('presence')

  connection.write = element => {
    t.is(element, element)
    t.is(element.attrs.xmlns, 'jabber:client')
  }

  connection.send(element)
})

test('socketParameters()', t => {
  let params

  params = ConnectionWebSocket.prototype.socketParameters('ws://foo')
  t.is(params, 'ws://foo')

  params = ConnectionWebSocket.prototype.socketParameters('wss://foo')
  t.is(params, 'wss://foo')

  params = ConnectionWebSocket.prototype.socketParameters('http://foo')
  t.is(params, undefined)
})

test('DOM WebSocket error', t => {
  const socket = new Socket()
  const sock = new EventEmitter()
  sock.addEventListener = sock.addListener
  socket._attachSocket(sock)
  socket.url = 'ws://foobar'
  const evt = {}
  socket.on('error', err => {
    t.is(err.message, 'WebSocket ECONNERROR ws://foobar')
    t.is(err.errno, 'ECONNERROR')
    t.is(err.code, 'ECONNERROR')
    t.is(err.url, 'ws://foobar')
    t.is(err.event, evt)
  })
  socket.socket.emit('error', evt)
})

test('WS WebSocket error', t => {
  const socket = new Socket()
  const sock = new EventEmitter()
  sock.addEventListener = sock.addListener
  socket._attachSocket(sock)
  socket.url = 'ws://foobar'
  const error = {}
  const evt = {error}
  socket.on('error', err => {
    t.is(err, error)
    t.is(err.event, evt)
    t.is(err.url, 'ws://foobar')
  })
  socket.socket.emit('error', evt)
})

test('socket close', t => {
  t.plan(3)
  const socket = new Socket()
  const sock = new EventEmitter()
  sock.addEventListener = sock.addListener
  sock.removeEventListener = sock.removeListener
  socket._attachSocket(sock)
  const evt = {wasClean: false}
  socket.on('close', (clean, event) => {
    t.is(clean, true)
    t.is(evt, event)
  })
  socket._detachSocket = () => {
    t.pass()
  }

  socket.socket.emit('close', evt)
})
