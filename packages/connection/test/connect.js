'use strict'

const test = require('ava')
const Connection = require('..')
const {EventEmitter} = require('@xmpp/events')

class Socket extends EventEmitter {
  connect(param, fn) {
    process.nextTick(fn)
  }
}

test('emits "connecting" status', t => {
  const conn = new Connection()
  conn.Parser = EventEmitter
  conn.Socket = Socket

  return Promise.all([
    conn.promise('connecting'),
    conn.promise('status').then(status => {
      t.is(status, 'connecting')
    }),
    conn.connect('url'),
  ])
})

test('rejects if an error is emitted before connected', t => {
  const conn = new Connection()
  conn.Parser = EventEmitter
  conn.Socket = Socket

  const error = new Error('foobar')

  t.is(conn._emitter.listenerCount('error'), 0)
  const promise = conn.connect('url')
  t.is(conn._emitter.listenerCount('error'), 1)
  conn.emit('error', error)
  return promise.catch(err => {
    t.is(conn._emitter.listenerCount('error'), 0)
    t.is(err, error)
  })
})

test('resolves if socket connects', t => {
  const conn = new Connection()
  conn.Parser = EventEmitter
  conn.Socket = Socket

  return conn.connect('url').then(() => {
    t.pass()
  })
})
