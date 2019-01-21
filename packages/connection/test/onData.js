'use strict'

const test = require('ava')
const Connection = require('..')

test.cb('#_onData', t => {
  t.plan(2)
  const foo = '<foo>'
  const conn = new Connection()
  conn.parser = {
    write() {
      throw new Error('foo')
    },
  }
  conn._streamError = condition => {
    t.is(condition, 'bad-format')
    t.end()
  }

  conn.on('input', data => {
    t.is(data, foo)
  })
  conn._onData(foo)
})
