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
  return t.context.fake(
    xml('iq', {id: 'test', from: 'foo', to: 'bar', type: 'set'},
      xml('test')
    )
  ).then(stanza => t.deepEqual(stanza,
    xml('iq', {id: 'test', from: 'bar', to: 'foo', type: 'error'},
      xml('error', {type: 'cancel'},
        xml('service-unavailable', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'})
      )
    )
  ))
})

test('add - sync', t => {
  t.context.plugin.add('test', 'test', () => {
    return xml('foo')
  })

  return t.context.fake(
    xml('iq', {id: 'test', from: 'foo', to: 'bar', type: 'set'},
      xml('test', {xmlns: 'test'})
    )
  ).then(stanza => t.deepEqual(stanza,
    xml('iq', {to: 'foo', from: 'bar', id: 'test', type: 'result'},
      xml('foo')
    )
  ))
})

test('add - promise resolves', t => {
  t.context.plugin.add('test', 'test', () => {
    return Promise.resolve(xml('foo'))
  })

  return t.context.fake(
    xml('iq', {id: 'test', from: 'foo', to: 'bar', type: 'set'},
      xml('test', {xmlns: 'test'})
    )
  ).then(stanza => t.deepEqual(stanza,
    xml('iq', {to: 'foo', from: 'bar', id: 'test', type: 'result'},
      xml('foo')
    )
  ))
})

test('add - promise rejects with element', t => {
  t.context.plugin.add('test', 'test', () => {
    return Promise.reject(xml('foo'))
  })

  return t.context.fake(
    xml('iq', {id: 'test', from: 'foo', to: 'bar', type: 'set'},
      xml('test', {xmlns: 'test'})
    )
  ).then(stanza => t.deepEqual(stanza,
    xml('iq', {id: 'test', from: 'bar', to: 'foo', type: 'error'},
      xml('foo')
    )
  ))
})

test('add - promise rejects with Error', t => {
  t.context.plugin.add('test', 'test', () => {
    return Promise.reject(new Error())
  })

  return t.context.fake(
    xml('iq', {id: 'test', from: 'foo', to: 'bar', type: 'set'},
      xml('test', {xmlns: 'test'})
    )
  ).then(stanza => t.deepEqual(stanza,
    xml('iq', {id: 'test', from: 'bar', to: 'foo', type: 'error'},
      xml('error', {type: 'cancel'},
        xml('internal-server-error', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'})
      )
    )
  ))
})
