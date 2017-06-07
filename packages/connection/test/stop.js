'use strict'

const test = require('ava')
const Connection = require('..')

test('resolves if socket property is undefined', t => {
  const conn = new Connection()
  return conn.stop().then(() => {
    t.pass()
  })
})

test.cb('close rejects', t => {
  t.plan(0)
  const conn = new Connection()
  conn.socket = {}
  conn.close = () => {
    return Promise.reject()
  }
  conn.disconnect = () => {
    t.fail()
    return Promise.resolve()
  }
  conn.stop().catch(() => {
    t.end()
  })
})

test.cb('close resolves', t => {
  t.plan(2)
  const conn = new Connection()
  conn.socket = {}
  const el = {}
  conn.close = () => {
    return Promise.resolve(el)
  }
  conn.disconnect = () => {
    t.pass()
    return Promise.resolve()
  }
  conn.stop().then(element => {
    t.is(el, element)
    t.end()
  })
})
