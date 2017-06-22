'use strict'

const test = require('ava')
const plugin = require('.')
const xml = require('@xmpp/xml/lib/x')
const testPlugin = require('../testPlugin')

test.beforeEach(t => {
  t.context = testPlugin(plugin)
})

test('name', t => {
  t.is(plugin.name, 'vcard')
})

test.cb('get', t => {
  t.plan(5)

  let id

  t.context.entity.promise('send').then(stanza => {
    id = stanza.attrs.id // eslint-disable-line prefer-destructuring
    delete stanza.attrs.id
    t.is(typeof id, 'string')

    t.context.entity.emit('element',
      xml('iq', {type: 'result', id},
        xml('vCard', {xmlns: 'vcard-temp'},
          xml('FN', {}, 'Foo Bar'),
          xml('N', {},
            xml('FAMILY', {}, 'Bar'),
            xml('GIVEN', {}, 'Foo')
          )
        )
      )
    )

    delete stanza.attrs.xmlns
    t.deepEqual(stanza,
      xml('iq', {type: 'get', to: 'foo@bar'},
        xml('vCard', {xmlns: 'vcard-temp'})
      )
    )
  })

  t.context.plugin.get('foo@bar').then(vcard => {
    t.is(vcard.FN, 'Foo Bar')
    t.is(vcard.N.FAMILY, 'Bar')
    t.is(vcard.N.GIVEN, 'Foo')
    t.end()
  })
})

test.cb('set', t => {
  t.plan(2)

  let id

  t.context.entity.promise('send').then(stanza => {
    id = stanza.attrs.id // eslint-disable-line prefer-destructuring
    delete stanza.attrs.id
    t.is(typeof id, 'string')

    t.context.entity.emit('element',
      xml('iq', {type: 'result', id})
    )

    delete stanza.attrs.xmlns
    t.deepEqual(stanza,
      xml('iq', {type: 'set'},
        xml('vCard', {xmlns: 'vcard-temp', version: '2.0'},
          xml('FN', {}, 'Foo Bar'),
          xml('N', {},
            xml('FAMILY', {}, 'Bar'),
            xml('GIVEN', {}, 'Foo')
          )
        )
      )
    )
    t.end()
  })

  t.context.plugin.set({FN: 'Foo Bar', N: {FAMILY: 'Bar', GIVEN: 'Foo'}})
})
