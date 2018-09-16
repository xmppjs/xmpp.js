'use strict'

const test = require('ava')
const {context} = require('@xmpp/test')
const _middleware = require('@xmpp/middleware')
const _iqCaller = require('@xmpp/iq/caller')
const _pingCaller = require('./caller')

test.beforeEach(t => {
  const ctx = context()
  const {entity} = ctx
  const middleware = _middleware(entity)
  const iqCaller = _iqCaller({middleware, entity})
  ctx.pingCaller = _pingCaller({iqCaller})
  t.context = ctx
})

test('#ping', t => {
  t.context.scheduleIncomingResult()

  return Promise.all([
    t.context.catchOutgoingGet().then(child => {
      t.deepEqual(child, <ping xmlns="urn:xmpp:ping" />)
    }),
    t.context.pingCaller.ping().then(val => {
      t.deepEqual(val, undefined)
    }),
  ])
})

test('#ping resolve for feature-not-implemented error', t => {
  t.context.scheduleIncomingError(
    <error type="cancel">
      <feature-not-implemented xmlns="urn:ietf:params:xml:ns:xmpp-stanzas" />
    </error>
  )

  return t.context.pingCaller.ping().then(val => {
    t.deepEqual(val, undefined)
  })
})
