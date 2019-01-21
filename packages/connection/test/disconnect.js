'use strict'

const test = require('ava')
const Connection = require('..')
const {EventEmitter} = require('@xmpp/events')

test.cb("rejects with TimeoutError if socket doesn't close", t => {
  t.plan(2)
  const conn = new Connection()
  const sock = (conn.socket = new EventEmitter())
  sock.end = () => {}
  conn.disconnect().catch(err => {
    t.is(err.name, 'TimeoutError')
    t.end()
  })
  t.is(conn.status, 'disconnecting')
})

test.cb('resolves', t => {
  t.plan(3)
  const conn = new Connection()
  const sock = new EventEmitter()
  conn._attachSocket(sock)
  sock.emit('connect')
  sock.end = () => {}
  conn
    .disconnect()
    .then(() => {
      t.is(conn.status, 'disconnect')
      return t.end()
    })
    .catch(t.fail)
  t.is(conn.status, 'disconnecting')
  sock.emit('close')
  t.is(conn.status, 'disconnect')
})

test.cb('rejects if socket.end throws', t => {
  t.plan(1)
  const conn = new Connection()
  const sock = (conn.socket = new EventEmitter())
  const error = new Error('foobar')
  sock.end = () => {
    throw error
  }

  conn.disconnect().catch(err => {
    t.is(err, error)
    t.end()
  })
})
