'use strict'

const test = require('ava')
const plugin = require('.')
const xml = require('@xmpp/xml')
const testPlugin = require('../testPlugin')

test.beforeEach(t => {
  t.context = testPlugin(plugin)
})

test('name', t => {
  t.is(plugin.name, 'iq-callee')
})

test('service-unavailable', t => {
  return t.context
  .test(xml`<iq id='test' from='foo' to='bar' type='set'><test/></iq>`)
  .then((stanza) => {
    t.deepEqual(stanza.attrs, {
      id: 'test',
      type: 'error',
      'from': 'bar',
      'to': 'foo',
      'xmlns': 'jabber:client',
    })
    t.is(stanza.children.length, 2)
    t.deepEqual(stanza.children[0].toString(), `<test/>`)
    t.is(stanza.children[1].toString(), `<error type="cancel"><service-unavailable xmlns="urn:ietf:params:xml:ns:xmpp-stanzas"/></error>`)
  })
})

test('add - sync', t => {
  t.context.plugin.add('test', 'test', (stanza) => {
    return xml`<'foo'/>`
  })
  return t.context
  .test(xml`<iq id='test' from='foo' to='bar' type='set'><test xmlns='test'/></iq>`)
  .then((stanza) => {
    t.is(stanza.toString(), `<iq to="foo" from="bar" id="test" xmlns="jabber:client" type="result"><'foo'/></iq>`)
  })
})

test('add - promise resolves', t => {
  t.context.plugin.add('test', 'test', (stanza) => {
    return Promise.resolve(xml`<'foo'/>`)
  })
  return t.context
  .test(xml`<iq id='test' from='foo' to='bar' type='set'><test xmlns='test'/></iq>`)
  .then((stanza) => {
    t.is(stanza.toString(), `<iq to="foo" from="bar" id="test" xmlns="jabber:client" type="result"><'foo'/></iq>`)
  })
})

test('add - promise rejects with element', t => {
  t.context.plugin.add('test', 'test', (stanza) => {
    return Promise.reject(xml`<'foo'/>`)
  })
  return t.context
  .test(xml`<iq id='test' from='foo' to='bar' type='set'><test xmlns='test'/></iq>`)
  .then((stanza) => {
    t.is(stanza.toString(), `<iq to="foo" from="bar" id="test" xmlns="jabber:client" type="error"><'foo'/></iq>`)
  })
})

test('add - promise rejects with Error', t => {
  t.context.plugin.add('test', 'test', (stanza) => {
    return Promise.reject(new Error())
  })
  return t.context
  .test(xml`<iq id='test' from='foo' to='bar' type='set'><test xmlns='test'/></iq>`)
  .then((stanza) => {
    t.is(stanza.toString(), `<iq to="foo" from="bar" id="test" xmlns="jabber:client" type="error"><error type="cancel"><internal-server-error xmlns="urn:ietf:params:xml:ns:xmpp-stanzas"/></error></iq>`)
  })
})
