'use strict'

const test = require('ava')
const Connection = require('..')
const {EventEmitter} = require('@xmpp/events')

test('resets properties on error event', t => {
  const conn = new Connection()
  conn._attachSocket(new EventEmitter())
  conn.domain = 'example.com'
  conn.lang = 'en'
  conn.jid = {}
  conn.on('error', () => {})
  conn.socket.emit('error', {})
  t.is(conn.domain, '')
  t.is(conn.lang, '')
  t.is(conn.jid, null)
  t.is(conn.socket, null)
})

test('sets status to offline if status is connecting', t => {
  const conn = new Connection()
  conn._attachSocket(new EventEmitter())
  conn.status = 'connecting'
  conn.on('error', () => {})
  conn.socket.emit('error', {})
  t.is(conn.status, 'offline')
})
