'use strict'

const test = require('ava')
const Connection = require('..')
const {EventEmitter} = require('@xmpp/events')
const xml = require('@xmpp/xml')

test.cb('timeout', t => {
  t.plan(2)
  const conn = new Connection()
  conn.parser = new EventEmitter()
  conn.footerElement = () => {
    return xml`<hello/>`
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
    return xml`<hello/>`
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
  conn.parser.emit('end', xml`<goodbye/>`)
})
