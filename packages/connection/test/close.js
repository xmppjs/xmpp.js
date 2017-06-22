'use strict'

const test = require('ava')
const Connection = require('..')
const {EventEmitter} = require('@xmpp/events')
const xml = require('@xmpp/xml')

test('resets properties on socket close event', t => {
  const conn = new Connection()
  conn._attachSocket(new EventEmitter())
  conn.lang = 'en'
  conn.jid = {}
  conn.domain = 'example.com'
  conn.status = 'online'
  conn.socket.emit('connect')
  conn.socket.emit('close')
  t.is(conn.lang, '')
  t.is(conn.jid, null)
  t.is(conn.domain, '')
  t.is(conn.status, 'disconnect')
})

test.cb('timeout', t => {
  t.plan(2)
  const conn = new Connection()
  conn.parser = new EventEmitter()
  conn.footerElement = () => {
    return xml('hello')
  }
  conn.socket = new EventEmitter()
  conn.socket.write = (data, cb) => {
    return cb()
  }
  conn.on('output', el => {
    t.is(el, '<hello/>')
  })
  conn.close().catch(err => {
    t.is(err.name, 'TimeoutError')
    t.end()
  })
})

test.cb('resolves', t => {
  t.plan(2)
  const conn = new Connection()
  conn.parser = new EventEmitter()
  conn.footerElement = () => {
    return xml('hello')
  }
  conn.socket = new EventEmitter()
  conn.socket.write = (data, cb) => {
    return cb()
  }
  conn.on('output', el => {
    t.is(el, '<hello/>')
  })
  conn.close().then(el => {
    t.is(el.toString(), `<goodbye/>`)
    t.end()
  })
  conn.parser.emit('end', xml('goodbye'))
})
