'use strict'

const test = require('ava')
const {context} = require('@xmpp/test')
const _middleware = require('@xmpp/middleware')
const _iqCallee = require('@xmpp/iq/callee')
const _discoCallee = require('@xmpp/service-discovery/callee')
const _pingCallee = require('./callee')

test.beforeEach(t => {
  const ctx = context()
  const {entity} = ctx
  const middleware = _middleware(entity)
  const iqCallee = _iqCallee({middleware, entity})
  const discoCallee = _discoCallee({iqCallee})
  ctx.discoCallee = discoCallee
  ctx.pingCallee = _pingCallee({discoCallee, iqCallee})
  t.context = ctx
})

test('disco feature', t => {
  t.true(t.context.discoCallee.features.has('urn:xmpp:ping'))
})

test('respond', t => {
  return t.context
    .fakeIncomingGet(<ping xmlns="urn:xmpp:ping" />)
    .then(child => {
      t.deepEqual(child, undefined)
    })
})
