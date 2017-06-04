'use strict'

const test = require('ava')
const jid = require('..')

test('Should not change string - issue 43', t => {
  const test = 'test\u001a@example.com'

  const addr = jid(test)
  t.is(addr.local, 'test\u001a')
})

test('Should escape - issue 43', t => {
  const test = 'test\u001aa@example.com'

  const addr = jid(test)
  t.is(addr.local, 'testa')
})
