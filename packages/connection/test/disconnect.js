'use strict'

const test = require('ava')
const Connection = require('..')
const {EventEmitter} = require('@xmpp/events')

test.cb('timeout', t => {
  t.plan(1)
  const conn = new Connection()
  const sock = (conn.socket = new EventEmitter())
  sock.end = () => {}
  conn.disconnect().catch(err => {
    t.is(err.name, 'TimeoutError')
    t.end()
  })
})

test.cb('resolves', t => {
  const conn = new Connection()
  const sock = (conn.socket = new EventEmitter())
  sock.end = () => {}
  conn.disconnect().then(() => {
    t.end()
  })
  sock.emit('close')
})
