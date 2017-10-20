'use strict'

const test = require('ava')
const plugin = require('../caller')
const testPlugin = require('../../testPlugin')

test.beforeEach(t => {
  t.context = testPlugin(plugin)
})

test('#ping', t => {
  t.context.scheduleIncomingResult()

  return Promise.all([
    t.context.catchOutgoingGet().then(child => {
      t.deepEqual(child, <ping xmlns="urn:xmpp:ping" />)
    }),
    t.context.plugin.ping().then(val => {
      t.deepEqual(val, undefined)
    }),
  ])
})

test('#ping resolve for feature-not-implemented error', t => {
  t.context.scheduleIncomingError(
    <error type='cancel'>
      <feature-not-implemented xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
    </error>
  )

  return t.context.plugin.ping().then(val => {
    t.deepEqual(val, undefined)
  })
})
