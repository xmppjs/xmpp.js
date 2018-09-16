'use strict'

const test = require('ava')
const {context} = require('@xmpp/test')
const _middleware = require('@xmpp/middleware')
const _iqCallee = require('@xmpp/iq/callee')
const _discoCallee = require('@xmpp/service-discovery/callee')
const _timeCallee = require('./callee')
const time = require('./time')

test.beforeEach(t => {
  const ctx = context()
  const {entity} = ctx
  const middleware = _middleware(entity)
  const iqCallee = _iqCallee({middleware, entity})
  const discoCallee = _discoCallee({iqCallee})
  ctx.discoCallee = discoCallee
  ctx.timeCallee = _timeCallee({discoCallee, iqCallee})
  t.context = ctx
})

test('disco feature', t => {
  t.true(t.context.discoCallee.features.has('urn:xmpp:time'))
})

test('respond', t => {
  return t.context
    .fakeIncomingGet(<time xmlns="urn:xmpp:time" />)
    .then(child => {
      t.deepEqual(
        child,
        <time xmlns="urn:xmpp:time">
          <tzo>{time.offset()}</tzo>
          <utc>{time.datetime()}</utc>
        </time>
      )
    })
})
