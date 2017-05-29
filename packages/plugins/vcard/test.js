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
  t.plan(7)

  t.context.entity.promise('send').then((stanza) => {
    t.is(stanza.name, 'iq')
    t.is(stanza.attrs.type, 'get')
    t.is(typeof stanza.attrs.id, 'string')
    t.is(stanza.children[0].toString(), '<vCard xmlns="vcard-temp"/>')

    t.context.entity.emit('element', xml`
      <iq type='result' id='${stanza.attrs.id}'>
        <vCard xmlns="vcard-temp">
          <FN>Foo Bar</FN>
          <N>
            <FAMILY>Bar</FAMILY>
            <GIVEN>Foo</GIVEN>
          </N>
        </vCard>
      </iq>
    `)
  })

  t.context.plugin.get().then((vcard) => {
    t.is(vcard.FN, 'Foo Bar')
    t.is(vcard.N.FAMILY, 'Bar')
    t.is(vcard.N.GIVEN, 'Foo')
    t.end()
  })
})
