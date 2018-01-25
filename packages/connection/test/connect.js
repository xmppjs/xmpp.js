'use strict'

const test = require('ava')
const Connection = require('..')
const {EventEmitter, promise} = require('@xmpp/events')

function socket(fn) {
  return class Socket extends EventEmitter {
    connect() {
      if (!fn) return
      Promise.resolve().then(() => {
        fn.call(this)
      })
    }
  }
}

test('emits "connecting" status', t => {
  const conn = new Connection()
  conn.Socket = socket(function() {
    this.emit('connect')
  })

  return Promise.all([
    promise(conn, 'connecting'),
    promise(conn, 'status').then(status => {
      t.is(status, 'connecting')
    }),
    conn.connect('url'),
  ])
})

test.skip('rejects if an error is emitted before connected', t => {
  const conn = new Connection()
  const error = new Error('foobar')

  conn.Socket = socket(function() {
    this.emit('error', error)
  })
  const promise = conn.connect('url')
  return promise.catch(err => {
    t.is(err, error)
  })
})

test('resolves if socket connects', t => {
  const conn = new Connection()
  conn.Socket = socket(function() {
    this.emit('connect')
  })

  return conn.connect('url').then(() => {
    t.pass()
  })
})
