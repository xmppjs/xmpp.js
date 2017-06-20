'use strict'

const test = require('ava')
const plugin = require('.')
const xml = require('@xmpp/xml')
const testPlugin = require('../testPlugin')

test.beforeEach(t => {
  t.context = testPlugin(plugin)
})

test('name', t => {
  t.is(plugin.name, 'ping')
})

test.cb('caller', t => {
  t.plan(4)

  t.context.entity.promise('send').then(stanza => {
    t.is(stanza.name, 'iq')
    t.is(stanza.attrs.type, 'get')
    t.is(typeof stanza.attrs.id, 'string')
    t.is(stanza.children[0].toString(), '<ping xmlns="urn:xmpp:ping"/>')
    t.context.entity.emit('element', xml`<iq type='result' id='${stanza.attrs.id}'/>`)
  })
  t.context.plugin.ping().then(() => {
    t.end()
  })
})

test('callee', t => {
  return t.context
    .fake`
    <iq id='test' from='foo' to='bar' type='set'>
      <ping xmlns='urn:xmpp:ping'/>
    </iq>
  `
    .then(stanza => t.deepEqual(stanza, xml`
    <iq to="foo" from="bar" id="test" type="result"/>
  `))
})
