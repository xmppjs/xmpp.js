'use strict'

const test = require('ava')
const Connection = require('..')

test('resolves if socket property is undefined', t => {
  const conn = new Connection()
  conn.footerElement = () => {
    return <foo />
  }
  return conn.stop().then(() => {
    t.pass()
  })
})

test.cb('close rejects', t => {
  t.plan(1)
  const conn = new Connection()
  conn.socket = {}
  conn.close = () => {
    return Promise.reject()
  }
  conn.disconnect = () => {
    t.pass()
  }
  conn.stop().then(() => {
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

test.cb('disconnect rejects', t => {
  t.plan(3)
  const conn = new Connection()
  conn.socket = {}
  const el = {}
  conn.close = () => {
    t.pass()
    return Promise.resolve(el)
  }
  conn.disconnect = () => {
    t.pass()
    return Promise.reject()
  }
  conn.stop().then(element => {
    t.is(el, element)
    t.end()
  })
})

test.cb('disconnect resolves', t => {
  t.plan(3)
  const conn = new Connection()
  conn.socket = {}
  const el = {}
  conn.close = () => {
    t.pass()
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
