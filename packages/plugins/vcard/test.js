'use strict'

const test = require('ava')
const plugin = require('.')
const xml = require('@xmpp/xml')
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

    t.context.entity.emit('element', xml`
      <iq type='result' id='${id}'>
        <vCard xmlns="vcard-temp">
          <FN>Foo Bar</FN>
          <N>
            <FAMILY>Bar</FAMILY>
            <GIVEN>Foo</GIVEN>
          </N>
        </vCard>
      </iq>
    `)

    delete stanza.attrs.xmlns
    t.deepEqual(stanza, xml`
      <iq type='get' to='foo@bar'>
        <vCard xmlns='vcard-temp'/>
      </iq>
    `)
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

    t.context.entity.emit('element', xml`
      <iq type='result' id='${id}'/>
    `)

    delete stanza.attrs.xmlns
    t.deepEqual(stanza, xml`
      <iq type='set'>
        <vCard xmlns='vcard-temp' version='2.0'>
          <FN>Foo Bar</FN>
          <N>
            <FAMILY>Bar</FAMILY>
            <GIVEN>Foo</GIVEN>
          </N>
        </vCard>
      </iq>
    `)
    t.end()
  })

  t.context.plugin.set({FN: 'Foo Bar', N: {FAMILY: 'Bar', GIVEN: 'Foo'}})
})
