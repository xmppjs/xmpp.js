'use strict'

const test = require('ava')
const {socketConnect} = require('..')
const EventEmitter = require('events')

class Socket extends EventEmitter {
  constructor(fn) {
    super()
    this.fn = fn
  }

  async connect() {
    if (!this.fn) return
    await Promise.resolve()
    this.fn()
  }
}

test('resolves if "connect" is emitted', async t => {
  const value = {}
  const socket = new Socket(function() {
    this.emit('connect', value)
  })
  t.is(socket.listenerCount('error'), 0)
  t.is(socket.listenerCount('connect'), 0)
  const p = socketConnect(socket, 'foo')
  t.is(socket.listenerCount('error'), 1)
  t.is(socket.listenerCount('connect'), 1)
  const result = await p
  t.is(result, value)
  t.is(socket.listenerCount('error'), 0)
  t.is(socket.listenerCount('connect'), 0)
})

test('rejects if "error" is emitted', t => {
  const error = new Error('foobar')
  const socket = new Socket(function() {
    this.emit('error', error)
  })
  t.is(socket.listenerCount('error'), 0)
  t.is(socket.listenerCount('connect'), 0)
  const p = socketConnect(socket, 'foo')
  t.is(socket.listenerCount('error'), 1)
  t.is(socket.listenerCount('connect'), 1)
  return p.catch(err => {
    t.is(err, error)
    t.is(socket.listenerCount('error'), 0)
    t.is(socket.listenerCount('connect'), 0)
  })
})
