'use strict'

const test = require('ava')
const jid = require('..')

test('Should not change string - issue 43', t => {
  const test = 'test\u001A@example.com'

  const addr = jid(test)
  t.is(addr.local, 'test\u001A')
})

test('Should escape - issue 43', t => {
  const test = 'test\u001Aa@example.com'

  const addr = jid(test)
  t.is(addr.local, 'testa')
})
