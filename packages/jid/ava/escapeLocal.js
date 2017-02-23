'use strict'

const test = require('ava')
const JID = require('..').JID

test('Should not change string - issue 43', t => {
  const test = 'test\u001a@example.com'

  const jid = new JID(test)
  t.is(jid.escapeLocal('test\u001a'), 'test\u001a')
})

test('Should escape - issue 43', t => {
  const test = 'test\u001aa@example.com'

  const jid = new JID(test)
  t.is(jid.escapeLocal('test\u001aa'), 'testa')
})
