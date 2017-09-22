'use strict'

const test = require('ava')
const plugin = require('.')
const testPlugin = require('../testPlugin')
const xml = require('@xmpp/xml')

test.beforeEach(t => {
  t.context = testPlugin(plugin)
})

test('name', t => {
  t.is(plugin.name, 'vcard')
})

test('set', t => {
  t.context.scheduleIncomingResult()

  return Promise.all([
    t.context.catchOutgoingGet().then(child => {
      t.deepEqual(
        child,
        xml('vCard', {xmlns: 'vcard-temp'}, [
          xml('FN', {}, 'Foo Bar'),
          xml('N', {}, [xml('FAMILY', {}, 'Bar'), xml('GIVEN', {}, 'Foo')]),
        ])
      )
    }),
    t.context.plugin
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
    t.context.plugin.get().then(vcard => {
      t.deepEqual(vcard, {FN: 'Foo Bar', N: {FAMILY: 'Bar', GIVEN: 'Foo'}})
    }),
  ])
})
