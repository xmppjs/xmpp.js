'use strict'

const test = require('ava')
const Connection = require('..')

test('#_end', t => {
  t.plan(2)
  const conn = new Connection()
  conn.close = () => {
    t.pass()
    return Promise.resolve()
  }

  conn.disconnect = () => {
    t.pass()
    return Promise.resolve()
  }

  return conn._end()
})

test('#_end with close rejection', t => {
  t.plan(2)
  const conn = new Connection()
  conn.close = () => {
    t.pass()
    return Promise.reject()
  }

  conn.disconnect = () => {
    t.pass()
    return Promise.resolve()
  }

  return conn._end()
})

test('#_end with disconnect rejection', t => {
  t.plan(2)
  const conn = new Connection()
  conn.close = () => {
    t.pass()
    return Promise.resolve()
  }

  conn.disconnect = () => {
    t.pass()
    return Promise.reject()
  }

  return conn._end()
})

test('#_end with close and disconnect rejection', t => {
  t.plan(2)
  const conn = new Connection()
  conn.close = () => {
    t.pass()
    return Promise.reject()
  }

  conn.disconnect = () => {
    t.pass()
    return Promise.reject()
  }

  return conn._end()
})
