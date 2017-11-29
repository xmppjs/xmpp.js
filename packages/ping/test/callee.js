'use strict'

const test = require('ava')
const plugin = require('../callee')
const testPlugin = require('../../testPlugin')

test.beforeEach(t => {
  t.context = testPlugin(plugin)
})

test('disco feature', t => {
  t.true(t.context.plugins['disco-callee'].features.has('urn:xmpp:ping'))
})

test('respond', t => {
  return t.context
    .fakeIncomingGet(<ping xmlns="urn:xmpp:ping" />)
    .then(child => {
      t.deepEqual(child, undefined)
    })
})
