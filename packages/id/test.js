'use strict'

const test = require('ava')
const xid = require('.')

test('returns a non empty string', t => {
  t.is(typeof xid(), 'string')
  t.is(xid().length > 0, true)
})

test('dupliacates', t => {
  const id = xid()
  for (let i = 0; i < 1000000; i++) {
    t.not(id, xid())
  }
})
