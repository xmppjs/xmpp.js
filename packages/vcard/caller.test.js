'use strict'

const test = require('ava')
const {context, xml} = require('@xmpp/test')
const _vcardCaller = require('./caller')
const _middleware = require('@xmpp/middleware')
const _iqCaller = require('@xmpp/iq/caller')

test.beforeEach(t => {
  const ctx = context()
  const {entity} = ctx
  const middleware = _middleware({entity})
  const iqCaller = _iqCaller({middleware, entity})
  ctx.vcardCaller = _vcardCaller({iqCaller})
  t.context = ctx
})

test('set', t => {
  t.context.scheduleIncomingResult()

  return Promise.all([
    t.context.catchOutgoingSet().then(child => {
      t.deepEqual(
        child,
        xml('vCard', {xmlns: 'vcard-temp'}, [
          xml('FN', {}, 'Foo Bar'),
          xml('N', {}, [xml('FAMILY', {}, 'Bar'), xml('GIVEN', {}, 'Foo')]),
        ])
      )
    }),
    t.context.vcardCaller
      .set({FN: 'Foo Bar', N: {FAMILY: 'Bar', GIVEN: 'Foo'}})
      .then(value => {
        t.deepEqual(value, undefined)
      }),
  ])
})

test('get', t => {
  t.context.scheduleIncomingResult(
    xml(
      'vcard',
      {xmlns: 'vcard-temp'},
      xml('FN', {}, 'Foo Bar'),
      xml('N', {}, xml('FAMILY', {}, 'Bar'), xml('GIVEN', {}, 'Foo'))
    )
  )

  return Promise.all([
    t.context.catchOutgoingGet().then(child => {
      t.deepEqual(child, xml('vCard', {xmlns: 'vcard-temp'}))
    }),
    t.context.vcardCaller.get().then(vcard => {
      t.deepEqual(vcard, {FN: 'Foo Bar', N: {FAMILY: 'Bar', GIVEN: 'Foo'}})
    }),
  ])
})
