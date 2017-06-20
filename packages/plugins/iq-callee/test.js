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
    .fake`
    <iq id='test' from='foo' to='bar' type='set'>
      <test/>
    </iq>
  `
    .then(stanza => t.deepEqual(stanza, xml`
    <iq id='test' from='bar' to='foo' type='error'>
      <error type='cancel'>
        <service-unavailable xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
      </error>
    </iq>
  `))
})

test('add - sync', t => {
  t.context.plugin.add('test', 'test', () => {
    return xml`<foo/>`
  })

  return t.context
    .fake`
    <iq id='test' from='foo' to='bar' type='set'>
      <test xmlns='test'/>
    </iq>
  `
    .then(stanza => t.deepEqual(stanza, xml`
    <iq to="foo" from="bar" id="test" type="result">
      <foo/>
    </iq>
  `))
})

test('add - promise resolves', t => {
  t.context.plugin.add('test', 'test', () => {
    return Promise.resolve(xml`<foo/>`)
  })

  return t.context
    .fake`
    <iq id='test' from='foo' to='bar' type='set'>
      <test xmlns='test'/>
    </iq>
  `
    .then(stanza => t.deepEqual(stanza, xml`
    <iq to="foo" from="bar" id="test" type="result">
      <foo/>
    </iq>
  `))
})

test('add - promise rejects with element', t => {
  t.context.plugin.add('test', 'test', () => {
    return Promise.reject(xml`<foo/>`)
  })

  return t.context
    .fake`
    <iq id='test' from='foo' to='bar' type='set'>
      <test xmlns='test'/>
    </iq>
  `
    .then(stanza => t.deepEqual(stanza, xml`
    <iq to="foo" from="bar" id="test" type="error">
      <foo/>
    </iq>
  `))
})

test('add - promise rejects with Error', t => {
  t.context.plugin.add('test', 'test', () => {
    return Promise.reject(new Error())
  })

  return t.context
    .fake`
    <iq id='test' from='foo' to='bar' type='set'>
      <test xmlns='test'/>
    </iq>
  `
    .then(stanza => t.deepEqual(stanza, xml`
    <iq to="foo" from="bar" id="test" type="error">
      <error type="cancel">
        <internal-server-error xmlns="urn:ietf:params:xml:ns:xmpp-stanzas"/>
      </error>
    </iq>
  `))
})
