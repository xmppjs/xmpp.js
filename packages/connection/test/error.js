'use strict'

const test = require('ava')
const Connection = require('..')
const {EventEmitter} = require('@xmpp/events')

test('emit error on socket error', t => {
  const conn = new Connection()
  conn._attachSocket(new EventEmitter())
  const error = new Error('foobar')
  conn.on('error', err => {
    t.is(err, error)
  })
  conn.socket.emit('error', error)
})
